import { logger } from '../config/logger.js';
import { AppError } from '../utils/errors.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  let message = err.isOperational ? err.message : 'Internal server error';
  
  // Always log errors with structured format
  logger.error(err.message || 'Unhandled error', {
    statusCode,
    stack: err.stack,
    url: req.url,
    method: req.method,
    isOperational: err.isOperational
  });
  
  res.status(statusCode).json({ 
    success: false, 
    message,
    ...(process.env.NODE_ENV !== 'production' && { error: err.message })
  });
};

export const notFound = (req, res, next) => {
  next(new AppError('Resource not found', 404));
};
