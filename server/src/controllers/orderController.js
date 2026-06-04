import * as orderService from '../services/orderService.js';

export const checkout = async (req, res, next) => {
  try {
    const order = await orderService.checkout(req.user.id);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const listOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await orderService.listOrders(req.user.id, req.user.role === 'admin', page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (req, res, next) => {
  try {
    const order = await orderService.getOrder(req.params.id, req.user.id, req.user.role === 'admin');
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
