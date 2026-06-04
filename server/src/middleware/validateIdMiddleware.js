import { AppError } from '../utils/errors.js';

export const validateIdParam = (req, res, next) => {
  const id = req.params.id;
  if (!id || isNaN(parseInt(id)) || parseInt(id) < 1) {
    return next(new AppError('Invalid ID parameter', 400));
  }
  req.params.id = parseInt(id);
  next();
};
