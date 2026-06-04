import { body, query } from 'express-validator';
import { validateRequest } from './validationHandler.js';

/**
 * CRITICAL FIX: Enhanced numeric field validation
 * - Proper price validation with decimal precision
 * - Integer validation for quantities and power consumption
 * - No negative values allowed
 * - Range limits to prevent overflow
 */
export const createProductValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 3, max: 200 }).withMessage('Product name must be 3-200 characters'),
  
  body('brand')
    .trim()
    .notEmpty().withMessage('Brand is required')
    .isLength({ min: 2, max: 120 }).withMessage('Brand must be 2-120 characters'),
  
  /**
   * CRITICAL FIX: Price validation with decimal precision
   * Ensures values are proper decimals with max 2 decimal places
   */
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0.01, max: 999999.99 })
    .withMessage('Price must be between 0.01 and 999,999.99')
    .custom(val => {
      const parsed = parseFloat(val);
      const fixed = parseFloat(parsed.toFixed(2));
      return !Number.isNaN(fixed) && fixed >= 0.01 && fixed <= 999999.99;
    })
    .withMessage('Price must have maximum 2 decimal places'),
  
  body('hashrate')
    .trim()
    .notEmpty().withMessage('Hashrate is required')
    .isLength({ min: 1, max: 80 }).withMessage('Hashrate must be 1-80 characters'),
  
  /**
   * CRITICAL FIX: Power consumption validation
   * Must be positive integer, no negative values
   */
  body('power_consumption')
    .notEmpty().withMessage('Power consumption is required')
    .isInt({ min: 1, max: 100000 })
    .withMessage('Power consumption must be integer between 1 and 100,000 watts'),
  
  body('algorithm')
    .trim()
    .notEmpty().withMessage('Algorithm is required')
    .isLength({ min: 1, max: 80 }).withMessage('Algorithm must be 1-80 characters'),
  
  /**
   * CRITICAL FIX: Stock quantity validation
   * Must be non-negative integer
   */
  body('stock_quantity')
    .notEmpty().withMessage('Stock quantity is required')
    .isInt({ min: 0, max: 1000000 })
    .withMessage('Stock quantity must be integer between 0 and 1,000,000'),
  
  body('image_url')
    .optional()
    .trim()
    .isURL({ require_protocol: true }).withMessage('Image URL must be valid and include protocol')
    .isLength({ max: 500 }).withMessage('Image URL too long'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description must be 2000 characters or less'),
  
  validateRequest
];

export const updateProductValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Product name must not be empty')
    .isLength({ min: 3, max: 200 }).withMessage('Product name must be 3-200 characters'),
  
  body('brand')
    .optional()
    .trim()
    .notEmpty().withMessage('Brand must not be empty')
    .isLength({ min: 2, max: 120 }).withMessage('Brand must be 2-120 characters'),
  
  body('price')
    .optional()
    .isFloat({ min: 0.01, max: 999999.99 })
    .withMessage('Price must be between 0.01 and 999,999.99')
    .custom(val => {
      if (!val) return true;
      const parsed = parseFloat(val);
      const fixed = parseFloat(parsed.toFixed(2));
      return !Number.isNaN(fixed) && fixed >= 0.01 && fixed <= 999999.99;
    })
    .withMessage('Price must have maximum 2 decimal places'),
  
  body('hashrate')
    .optional()
    .trim()
    .notEmpty().withMessage('Hashrate must not be empty')
    .isLength({ max: 80 }).withMessage('Hashrate too long'),
  
  body('power_consumption')
    .optional()
    .isInt({ min: 1, max: 100000 })
    .withMessage('Power consumption must be integer between 1 and 100,000 watts'),
  
  body('algorithm')
    .optional()
    .trim()
    .notEmpty().withMessage('Algorithm must not be empty')
    .isLength({ max: 80 }).withMessage('Algorithm too long'),
  
  body('stock_quantity')
    .optional()
    .isInt({ min: 0, max: 1000000 })
    .withMessage('Stock quantity must be integer between 0 and 1,000,000'),
  
  body('image_url')
    .optional()
    .trim()
    .isURL({ require_protocol: true }).withMessage('Image URL must be valid and include protocol')
    .isLength({ max: 500 }).withMessage('Image URL too long'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description must be 2000 characters or less'),
  
  validateRequest
];

/**
 * CRITICAL FIX: Pagination validation with DOS prevention
 */
export const productQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 100000 })
    .withMessage('Page must be between 1 and 100,000'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search must be 1-100 characters'),
  
  query('brand')
    .optional()
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage('Brand filter must be 1-120 characters'),
  
  validateRequest
];
