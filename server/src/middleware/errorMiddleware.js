import { AppError } from '../utils/errors.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  let message = err.isOperational ? err.message : 'Internal server error';
  
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  } else {
    message = 'An error occurred';
  }
  
  res.status(statusCode).json({ success: false, message });
};

export const notFound = (req, res, next) => {
  next(new AppError('Resource not found', 404));
};
