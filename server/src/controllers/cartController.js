import * as cartService from '../services/cartService.js';

export const getCart = async (req, res, next) => {
  try {
    const items = await cartService.getCartItems(req.user.id);
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

export const addCartItem = async (req, res, next) => {
  try {
    const item = await cartService.addItem(req.user.id, req.body.product_id, req.body.quantity);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const item = await cartService.updateItem(req.user.id, req.params.id, req.body.quantity);
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const deleteCartItem = async (req, res, next) => {
  try {
    await cartService.removeItem(req.user.id, req.params.id);
    res.json({ success: true, data: { message: 'Cart item removed' } });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const result = await cartService.clearCart(req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
