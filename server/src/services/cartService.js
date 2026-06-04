import { NotFoundError, BusinessLogicError } from '../utils/customErrors.js';
import * as cartModel from '../models/cartModel.js';
import * as productModel from '../models/productModel.js';

export const getCartItems = async (userId) => {
  return cartModel.findByUser(userId);
};

export const addItem = async (userId, productId, quantity) => {
  const product = await productModel.findById(productId);
  if (!product) {
    throw new NotFoundError('Product');
  }

  const existingItem = await cartModel.findItem(userId, productId);
  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    if (newQuantity > 9999) {
      throw new BusinessLogicError('Cart quantity exceeds maximum limit of 9,999', 400);
    }
    return cartModel.update(existingItem.id, userId, newQuantity);
  }

  return cartModel.create(userId, productId, quantity);
};

export const updateItem = async (userId, itemId, quantity) => {
  const item = await cartModel.findById(itemId, userId);
  if (!item) {
    throw new NotFoundError('Cart item');
  }

  if (quantity > 9999) {
    throw new BusinessLogicError('Quantity exceeds maximum limit of 9,999', 400);
  }

  return cartModel.update(itemId, userId, quantity);
};

export const removeItem = async (userId, itemId) => {
  const item = await cartModel.findById(itemId, userId);
  if (!item) {
    throw new NotFoundError('Cart item');
  }
  await cartModel.remove(itemId, userId);
  return { message: 'Item removed from cart' };
};

export const clearCart = async (userId) => {
  await cartModel.clear(userId);
  return { message: 'Cart cleared' };
};
