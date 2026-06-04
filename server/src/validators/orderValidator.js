import { body, param } from 'express-validator';
import { validateRequest } from './validationHandler.js';

const VALID_ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

export const createOrderValidation = [
  validateRequest
];

export const orderStatusValidation = [
  param('id')
    .isInt({ gt: 0, lt: 2147483647 }).withMessage('Invalid order ID'),
  body('status')
    .isIn(VALID_ORDER_STATUSES)
    .withMessage(`Status must be one of: ${VALID_ORDER_STATUSES.join(', ')}`),
  validateRequest
];

export const orderIdValidation = [
  param('id')
    .isInt({ gt: 0, lt: 2147483647 }).withMessage('Invalid order ID'),
  validateRequest
];
