import { BusinessLogicError, NotFoundError } from '../utils/customErrors.js';
import * as orderModel from '../models/orderModel.js';
import * as cartModel from '../models/cartModel.js';
import * as productModel from '../models/productModel.js';

export const checkout = async (userId) => {
  return orderModel.withTransaction(async (connection) => {
    const cartItems = await cartModel.findByUser(userId, connection);
    if (!cartItems.length) {
      throw new BusinessLogicError('Cart is empty', 400);
    }

    let totalAmount = 0;
    const productLocks = new Map();

    for (const item of cartItems) {
      if (!productLocks.has(item.product_id)) {
        const product = await productModel.lockForUpdate(item.product_id, connection);
        if (!product) {
          throw new NotFoundError('Product');
        }
        productLocks.set(item.product_id, product);
      }

      const product = productLocks.get(item.product_id);
      if (product.stock_quantity < item.quantity) {
        throw new BusinessLogicError(
          `Insufficient stock for '${item.name}': requested ${item.quantity}, available ${product.stock_quantity}`,
          409
        );
      }

      totalAmount += item.price * item.quantity;
    }

    const order = await orderModel.create(userId, totalAmount, 'pending', connection);

    for (const item of cartItems) {
      await orderModel.createItem(order.id, item.product_id, item.quantity, item.price, connection);
      const adjusted = await productModel.adjustStock(item.product_id, -item.quantity, connection);
      if (!adjusted) {
        throw new BusinessLogicError(`Failed to reserve stock for product ${item.product_id}`, 500);
      }
    }

    await cartModel.clear(userId, connection);

    const orderDetails = await orderModel.findById(order.id, connection);
    const orderItems = await orderModel.itemsByOrder(order.id, connection);

    return { ...orderDetails, items: orderItems };
  });
};

export const listOrders = async (userId, isAdmin, page = 1, limit = 20) => {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  
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
