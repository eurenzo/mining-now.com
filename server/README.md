# Mining Now - Crypto Mining Shop Backend

Production-ready Node.js backend for an e-commerce platform selling cryptocurrency mining machines.

## Architecture

**3-Layer Clean Architecture:**
- **Routes** - Endpoint definitions only
- **Controllers** - Request/response logic
- **Services** - Business logic and domain rules
- **Models** - Database queries with parameterized statements

## Setup

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your database credentials
# DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, ALLOWED_ORIGINS
```

### Database Setup

```bash
# Create database and tables
mysql -u root -p < sql/schema.sql

# Seed sample data (admin user + products)
npm run seed
```

### Running

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

Server runs on `http://localhost:4000`

---

## Security Fixes Applied

### 1. **Stock Race Condition → Pessimistic Locking**
- **Issue**: Cart additions checked stock without transactional lock, allowing overselling
- **Fix**: `FOR UPDATE` row-level locking during checkout prevents concurrent modifications
- **Impact**: Stock integrity guaranteed even with simultaneous orders

### 2. **Transaction Isolation → All Mutations Inside Transaction**
- **Issue**: Post-commit queries executed outside transaction, reading stale/uncommitted data
- **Fix**: All queries during checkout stay within transaction; only finalize after commit
- **Impact**: Consistent order data returned immediately

### 3. **Open CORS → Whitelist Origins**
- **Issue**: `cors()` allowed any origin to call API
- **Fix**: `ALLOWED_ORIGINS` env variable with whitelist validation
- **Impact**: XSS and CSRF attacks mitigated

```env
ALLOWED_ORIGINS=http://localhost:3000,https://miningnow.com
```

### 4. **No Rate Limiting → Auth & API Rate Limits**
- **Issue**: Brute force attacks possible on login/register
- **Fix**: 5 attempts per 15 min on auth, 100 per 15 min on general API
- **Impact**: Brute force protection, DoS mitigation

### 5. **No Request Size Limits → 10MB Cap + Size Validation**
- **Issue**: Accept unlimited payload → memory exhaustion
- **Fix**: `limit: '10mb'` + pre-flight size check
- **Impact**: DoS protection

### 6. **Unsafe Model Updates → Field Whitelisting**
- **Issue**: Any field updatable via request body (e.g., `stock_quantity`)
- **Fix**: `allowedFields` array per model, only whitelisted fields updated
- **Impact**: Prevents data corruption and privilege escalation

### 7. **No Pagination on Orders → Default 20 Items/Page**
- **Issue**: `GET /orders` returned all orders, OOM on large datasets
- **Fix**: Pagination with defaults (page=1, limit=20)
- **Impact**: Memory and performance optimization

### 8. **Missing ID Validation → Numeric Type Validation**
- **Issue**: Routes accept any `:id` value, SQL errors or no-ops
- **Fix**: `validateIdParam` middleware ensures positive integers
- **Impact**: Cleaner errors, prevents invalid queries

### 9. **No Input Sanitization → XSS Cleanup**
- **Issue**: User input stored as-is, potential stored XSS
- **Fix**: `xss` library strips malicious HTML/scripts
- **Impact**: Prevents stored XSS attacks

### 10. **Database Errors Exposed → Generic Messages in Production**
- **Issue**: SQL errors, stack traces leaked in responses
- **Fix**: Only operational errors shown; stack traces hidden in production
- **Impact**: Information disclosure prevented

### 11. **Removed Cart Stock Validation**
- **Issue**: Cart checked stock before adding (race condition source)
- **Fix**: Cart accepts any quantity; stock validated at checkout with lock
- **Impact**: Simplified cart logic, stock safety moved to checkout

---

## API Endpoints

### Authentication

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: 201
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: 200
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    }
  }
}
```

#### Get Profile
```http
GET /api/v1/auth/me
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "created_at": "2026-06-04T10:00:00Z",
    "updated_at": "2026-06-04T10:00:00Z"
  }
}
```

---

### Products

#### List Products (Paginated, Searchable)
```http
GET /api/v1/products?page=1&limit=20&search=antminer&brand=Bitmain

Response: 200
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45
    }
  }
}
```

#### Get Product
```http
GET /api/v1/products/1
```

#### Create Product (Admin Only)
```http
POST /api/v1/products
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Whatsminer M50S",
  "brand": "MicroBT",
  "price": 5200,
  "hashrate": "126 TH/s",
  "power_consumption": 3276,
  "algorithm": "SHA-256",
  "stock_quantity": 8,
  "image_url": "https://...",
  "description": "Efficient miner..."
}

Response: 201
```

#### Update Product (Admin Only)
```http
PUT /api/v1/products/1
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "price": 5100,
  "stock_quantity": 12
}

Response: 200
```

Whitelisted fields: `name`, `brand`, `price`, `hashrate`, `power_consumption`, `algorithm`, `image_url`, `description`

#### Delete Product (Admin Only)
```http
DELETE /api/v1/products/1
Authorization: Bearer <admin_token>

Response: 200
```

---

### Cart

#### Get Cart
```http
GET /api/v1/cart
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": [...]
}
```

#### Add to Cart
```http
POST /api/v1/cart/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "product_id": 1,
  "quantity": 2
}

Response: 201
```

#### Update Cart Item
```http
PUT /api/v1/cart/items/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}

Response: 200
```

#### Remove from Cart
```http
DELETE /api/v1/cart/items/1
Authorization: Bearer <token>

Response: 200
```

#### Clear Cart
```http
DELETE /api/v1/cart/clear
Authorization: Bearer <token>

Response: 200
```

---

### Orders

#### Checkout (Creates Order + Locks Stock)
```http
POST /api/v1/orders
Authorization: Bearer <token>

Response: 201
{
  "success": true,
  "data": {
    "id": 5,
    "user_id": 1,
    "total_amount": "9000.00",
    "status": "pending",
    "items": [...]
  }
}
```

#### List Orders (Paginated)
```http
GET /api/v1/orders?page=1&limit=20
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "orders": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5
    }
  }
}
```

#### Get Order
```http
GET /api/v1/orders/5
Authorization: Bearer <token>

Response: 200
```

#### Update Order Status (Admin Only)
```http
PATCH /api/v1/orders/5/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "shipped"
}

Response: 200
```

Valid statuses: `pending`, `paid`, `shipped`, `delivered`, `cancelled`

---

### Users (Admin Only)

#### List Users
```http
GET /api/v1/users
Authorization: Bearer <admin_token>

Response: 200
{
  "success": true,
  "data": [...]
}
```

#### Get User
```http
GET /api/v1/users/1
Authorization: Bearer <admin_token>
```

#### Update User
```http
PUT /api/v1/users/1
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "role": "admin"
}

Response: 200
```

Whitelisted fields: `name`, `email`, `role`

#### Delete User
```http
DELETE /api/v1/users/1
Authorization: Bearer <admin_token>

Response: 200
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Status Codes
- `400` - Bad Request (validation failed)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate email)
- `413` - Payload Too Large (request > 10MB)
- `422` - Unprocessable Entity (validation error)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Environment Variables

```
PORT                  - Server port (default: 4000)
DB_HOST              - MySQL host (default: 127.0.0.1)
DB_USER              - MySQL user (default: root)
DB_PASSWORD          - MySQL password
DB_NAME              - Database name (default: mining_shop)
JWT_SECRET           - JWT signing key (required in production)
JWT_EXPIRES_IN       - Token TTL (default: 7d)
NODE_ENV             - development | production
ALLOWED_ORIGINS      - CORS whitelist (comma-separated URLs)
```

---

## Security Checklist

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT authentication with expiry
- ✅ Role-based authorization (admin/customer)
- ✅ Parameterized queries (SQL injection protected)
- ✅ Rate limiting on auth endpoints (5/15min)
- ✅ Rate limiting on API (100/15min)
- ✅ CORS whitelist
- ✅ Request size limits (10MB)
- ✅ Input sanitization (XSS protection)
- ✅ Error message sanitization (info disclosure prevented)
- ✅ Row-level locking for stock integrity
- ✅ Helmet security headers
- ✅ Transactional consistency during checkout
- ✅ Field whitelisting on updates

---

## License

MIT
