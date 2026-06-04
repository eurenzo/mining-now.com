import { body, param } from 'express-validator';
import { validateRequest } from './validationHandler.js';

export const updateUserValidation = [
  param('id')
    .isInt({ gt: 0, lt: 2147483647 }).withMessage('Invalid user ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name must not be empty')
    .isLength({ min: 2, max: 120 }).withMessage('Name must be 2-120 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name contains invalid characters'),
  body('email')
    .optional()
    .trim()
    .toLowerCase()
    .isEmail().withMessage('Must be a valid email')
    .isLength({ max: 255 }).withMessage('Email too long'),
  body('role')
    .optional()
    .isIn(['admin', 'customer']).withMessage('Role must be admin or customer'),
  validateRequest
];

export const userIdValidation = [
  param('id')
    .isInt({ gt: 0, lt: 2147483647 }).withMessage('Invalid user ID'),
  validateRequest
];
