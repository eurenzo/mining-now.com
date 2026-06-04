# Checkout Transaction Refactoring

## Overview

The checkout workflow has been refactored to use **SERIALIZABLE isolation level** database transactions, ensuring strong consistency and preventing race conditions even under extreme concurrency.

---

## Key Improvements

### 1. **Isolation Level: SERIALIZABLE**

**Before:**
```javascript
await connection.beginTransaction(); // Default: REPEATABLE READ
```

**After:**
```javascript
await connection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
await connection.beginTransaction();
```

**Why:** 
- `REPEATABLE READ` allows phantom reads (new rows inserted by concurrent transactions)
- `SERIALIZABLE` prevents all anomalies (dirty reads, non-repeatable reads, phantom reads)
- Guarantees that checkout cannot see inventory changes from concurrent transactions

**Impact:** Even if 10 concurrent checkouts occur simultaneously, each sees a frozen snapshot of the cart and product inventory.

---

### 2. **Transaction Helper Function**

**Before:**
```javascript
const connection = await orderModel.transaction();
try {
  // operations
  await orderModel.commit(connection);
} catch (error) {
  await orderModel.rollback(connection);
  throw error;
}
```

**After:**
```javascript
export const withTransaction = async (callback) => {
  const connection = await transaction();
  try {
    const result = await callback(connection);
    await commit(connection);
    return result;
  } catch (error) {
    await rollback(connection);
    throw error;
  }
};

// Usage:
return orderModel.withTransaction(async (connection) => {
  // operations with connection
  return result;
});
```

**Why:**
- Eliminates manual try-catch boilerplate
- Guarantees connection cleanup in all error paths
- Reduces bugs from forgotten rollback/commit calls
- Cleaner, more readable code

---

### 3. **Cart Fetching Inside Transaction**

**Before:**
```javascript
const cartItems = await cartModel.findByUser(userId); // Outside transaction
const connection = await orderModel.transaction();
try {
  // Process with outdated cart snapshot
}
```

**After:**
```javascript
return orderModel.withTransaction(async (connection) => {
  const cartItems = await cartModel.findByUser(userId, connection); // Inside transaction
  // Process with current, locked cart
});
```

**Why:**
- Prevents cart items from being deleted between fetch and checkout
- Cart lock is held for the entire transaction duration
- Ensures user cannot modify cart while checkout is in progress

**Race Condition Prevented:**
```
Thread A: Fetch cart (product 1, qty 5)        [Outside transaction]
Thread B: Delete product 1 from cart
Thread A: Begin transaction
Thread A: Lock cart for product 1               [Now sees different state]
```

Now prevents this because cart is fetched **inside** transaction lock.

---

### 4. **Robust Connection Cleanup**

**Before:**
```javascript
export const commit = async (connection) => {
  await connection.commit();
  connection.release(); // If commit fails, not called
};
```

**After:**
```javascript
export const commit = async (connection) => {
  try {
    await connection.commit();
  } finally {
    connection.release(); // Always called
  }
};

export const rollback = async (connection) => {
  try {
    await connection.rollback();
  } finally {
    connection.release(); // Always called
  }
};
```

**Why:**
- Prevents connection leaks if commit/rollback throws
- `finally` block executes regardless of success/failure
- Ensures pool doesn't run out of connections

---

### 5. **Duplicate Lock Prevention**

**Added:**
```javascript
const productLocks = new Map();

for (const item of cartItems) {
  if (!productLocks.has(item.product_id)) {
    const product = await productModel.lockForUpdate(item.product_id, connection);
    productLocks.set(item.product_id, product);
  }

  const product = productLocks.get(item.product_id);
  // Use cached product instead of re-locking
}
```

**Why:**
- If cart has 2 units of same product, lock only once
- Reduces database round-trips
- Prevents deadlocks from redundant locks

---

### 6. **Improved Error Messages**

**Before:**
```javascript
throw new AppError(`Insufficient stock for product ${item.name}`, 400);
```

**After:**
```javascript
throw new AppError(
  `Insufficient stock for '${item.name}': requested ${item.quantity}, available ${product.stock_quantity}`, 
  409
);
```

**Why:**
- 409 Conflict is more semantic than 400 Bad Request
- Provides actionable information for API clients
- Helps debug inventory issues

---

## Transaction Flow Diagram

```
POST /api/v1/orders
├─ withTransaction(callback)
│  ├─ getConnection()
│  ├─ SET ISOLATION LEVEL SERIALIZABLE
│  ├─ BEGIN TRANSACTION
│  │
│  ├─ callback(connection)
│  │  ├─ Fetch cart items (INSIDE transaction)
│  │  ├─ Validate cart not empty
│  │  ├─ FOR each item:
│  │  │  ├─ SELECT * FROM products WHERE id = ? FOR UPDATE
│  │  │  ├─ Validate stock
│  │  │  └─ Cache in productLocks Map
│  │  ├─ Create order
│  │  ├─ FOR each item:
│  │  │  ├─ INSERT order_items
│  │  │  └─ UPDATE products stock_quantity
│  │  ├─ DELETE FROM cart_items
│  │  ├─ Fetch order details (INSIDE transaction)
│  │  └─ Return order with items
│  │
│  ├─ COMMIT TRANSACTION
│  ├─ release(connection)
│  └─ Return result
│
└─ Response: 201 {order}
```

---

## Concurrency Guarantees

### Scenario: 2 Users Checkout Same 1 Product Simultaneously

```
User A Checkout          User B Checkout
├─ BEGIN SERIALIZABLE    
├─ Fetch cart            ├─ BEGIN SERIALIZABLE
├─ SELECT * FROM prod 1  ├─ Fetch cart
│  FOR UPDATE            ├─ SELECT * FROM prod 1
│  └─ LOCK ACQUIRED      │  FOR UPDATE
                         │  └─ BLOCKED (waiting for lock)
├─ qty = 1, available=1  
├─ INSERT order          
├─ UPDATE prod stock=-1  
├─ DELETE cart           
├─ COMMIT                ├─ Lock acquired
│  └─ Release lock       ├─ qty = 1, available=0
                         ├─ Throws: "Insufficient stock"
                         └─ ROLLBACK
                            └─ Release lock

Result: User A succeeds, User B gets "Insufficient stock" error.
No overselling possible.
```

---

## Performance Considerations

### When Transactions Help
- Multiple products in cart: Single transaction is faster than separate operations
- High concurrency: Prevents repetitive lock-wait cycles
- Data consistency: No extra validation queries needed

### When Transactions May Slow Down
- Long-running checkout logic outside transactions (logs, webhooks)
- Blocking operations inside transaction (network calls)

### Best Practice
Keep transaction scope minimal—only database operations:
```javascript
// ✅ Good: Fast operations inside transaction
withTransaction(async (conn) => {
  const cartItems = await findCart(conn);
  const order = await createOrder(conn);
  return order;
});

// ❌ Bad: Slow operations blocking others
withTransaction(async (conn) => {
  const order = await createOrder(conn);
  await sendEmail(order); // Network call inside transaction!
  return order;
});
```

---

## Testing Checklist

- [ ] Single checkout completes successfully
- [ ] Concurrent checkouts with same product prevent overselling
- [ ] Cart clearing works inside transaction
- [ ] Stock accuracy after 10 concurrent checkouts
- [ ] Connection pool doesn't leak under errors
- [ ] Proper error messages returned
- [ ] Order details consistent with order items

---

## Files Changed

1. **src/models/orderModel.js**
   - Added SERIALIZABLE isolation level
   - Added `withTransaction()` helper
   - Robust connection cleanup

2. **src/models/cartModel.js**
   - `findByUser()` now accepts connection parameter

3. **src/services/orderService.js**
   - Moved cart fetch inside transaction
   - Added duplicate lock prevention
   - Improved error messages
   - Simplified using `withTransaction()`

---

## Migration Notes

**No database schema changes required.** The refactoring is backwards compatible:
- SERIALIZABLE isolation is a MySQL/InnoDB feature
- Parameterized queries unchanged
- API response format unchanged

**For existing deployments:**
1. Deploy code changes
2. Test in staging with concurrent checkouts
3. Monitor connection pool usage in production
4. No data migration needed

---

## Related Security Improvements

- Stock locked via pessimistic locking (FOR UPDATE)
- Cart cleared atomically with order creation
- No gap where cart remains after checkout fails
- Transaction rollback cleans up all partial state

---

## References

- MySQL Transaction Isolation Levels: https://dev.mysql.com/doc/refman/8.0/en/transaction-isolation.html
- InnoDB Locking: https://dev.mysql.com/doc/refman/8.0/en/innodb-locking.html
- Express.js Connection Pooling: https://github.com/mysqljs/mysql2
