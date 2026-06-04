import { body, param } from 'express-validator';
import { validateRequest } from './validationHandler.js';

export const addCartItemValidation = [
  body('product_id')
    .isInt({ gt: 0, lt: 2147483647 }).withMessage('Invalid product ID'),
  body('quantity')
    .isInt({ gt: 0, lt: 10000 }).withMessage('Quantity must be 1-9,999'),
  validateRequest
];

export const updateCartItemValidation = [
  param('id')
    .isInt({ gt: 0, lt: 2147483647 }).withMessage('Invalid cart item ID'),
  body('quantity')
    .isInt({ gt: 0, lt: 10000 }).withMessage('Quantity must be 1-9,999'),
  validateRequest
];
