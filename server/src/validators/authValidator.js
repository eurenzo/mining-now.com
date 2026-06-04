import { body } from 'express-validator';
import { validateRequest } from './validationHandler.js';

export const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 120 }).withMessage('Name must be 2-120 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name contains invalid characters'),
  body('email')
    .trim()
    .toLowerCase()
    .isEmail().withMessage('Valid email is required')
    .isLength({ max: 255 }).withMessage('Email too long'),
  body('password')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters')
    .matches(/[A-Z]/).withMessage('Password must contain uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain number')
    .matches(/[!@#$%^&*]/).withMessage('Password must contain special character (!@#$%^&*)'),
  validateRequest
];

export const loginValidation = [
  body('email')
    .trim()
    .toLowerCase()
    .isEmail().withMessage('Valid email is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ max: 128 }).withMessage('Invalid password'),
  validateRequest
];
