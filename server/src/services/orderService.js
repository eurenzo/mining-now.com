import { BusinessLogicError, NotFoundError } from '../utils/customErrors.js';
import * as orderModel from '../models/orderModel.js';
import * as cartModel from '../models/cartModel.js';
import * as productModel from '../models/productModel.js';
import { logger } from '../config/logger.js';

/**
 * CRITICAL FIX: Improved checkout with proper stock locking
 * - Re-fetches products with fresh locks
 * - Uses atomic updates to prevent overselling
 * - Validates stock at checkout time
 */
export const checkout = async (userId) => {
  return orderModel.withTransaction(async (connection) => {
    const cartItems = await cartModel.findByUser(userId, connection);
    if (!cartItems.length) {
      throw new BusinessLogicError('Cart is empty', 400);
    }

    let totalAmount = 0;

    // FIRST PASS: Check stock availability with locks
    for (const item of cartItems) {
      // Re-fetch with fresh lock for each check - prevents stale reads
      const product = await productModel.lockForUpdate(item.product_id, connection);
      if (!product) {
        throw new NotFoundError('Product');
      }

      // Validate sufficient stock at THIS moment
      if (product.stock_quantity < item.quantity) {
        throw new BusinessLogicError(
          `Insufficient stock for '${item.name}': requested ${item.quantity}, available ${product.stock_quantity}`,
          409
        );
      }

      // Calculate total using proper decimal arithmetic (in cents to avoid float issues)
      const itemPrice = Math.round(parseFloat(item.price) * 100);
      const itemTotal = itemPrice * item.quantity;
      totalAmount += itemTotal;
    }

    // Convert from cents back to decimal
    const totalAmountDecimal = totalAmount / 100;

    // Create order
    const order = await orderModel.create(userId, totalAmountDecimal, 'pending', connection);

    // SECOND PASS: Reserve stock atomically
    for (const item of cartItems) {
      await orderModel.createItem(order.id, item.product_id, item.quantity, item.price, connection);
      
      // CRITICAL: Use atomic update with validation
      // This ensures stock cannot go negative and validates minimum required
      const reserved = await productModel.adjustStockAtomic(
        item.product_id, 
        -item.quantity,
        item.quantity,  // Validate at least this much is available
        connection
      );
      
      if (!reserved) {
        throw new BusinessLogicError(
          `Stock reserved by another transaction for product ${item.product_id}. Please retry checkout.`,
          409
        );
      }
    }

    // Clear cart after successful checkout
    await cartModel.clear(userId, connection);

    // Fetch complete order details
    const orderDetails = await orderModel.findById(order.id, connection);
    const orderItems = await orderModel.itemsByOrder(order.id, connection);

    logger.info('Order created successfully', {
      orderId: order.id,
      userId,
      totalAmount: totalAmountDecimal,
      itemCount: cartItems.length
    });

    return { ...orderDetails, items: orderItems };
  });
};

export const listOrders = async (userId, isAdmin, page = 1, limit = 20) => {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  
  // CRITICAL FIX: Prevent excessive offset (DOS attack)
  const MAX_OFFSET = 100000;
  const offset = (page - 1) * limit;
  
  if (offset > MAX_OFFSET) {
    throw new BusinessLogicError(
      `Maximum offset exceeded. Use earlier pages or reduce limit.`,
      400
    );
  }
  
  const orders = await orderModel.findAll(userId, isAdmin, page, limit);
  const total = await orderModel.count(userId, isAdmin);
  
  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getOrder = async (orderId, userId, isAdmin) => {
  const order = await orderModel.findForUser(orderId, userId, isAdmin);
  if (!order) {
    throw new NotFoundError('Order');
  }
  const items = await orderModel.itemsByOrder(order.id);
  return { ...order, items };
};

export const updateStatus = async (orderId, status) => {
  const order = await orderModel.findById(orderId);
  if (!order) {
    throw new NotFoundError('Order');
  }
  return orderModel.updateStatus(orderId, status);
};
