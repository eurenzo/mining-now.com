import { validationResult } from 'express-validator';
import { AppError } from '../utils/errors.js';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map(error => `${error.param}: ${error.msg}`).join(', ');
    return next(new AppError(message, 422));
  }
  next();
};
