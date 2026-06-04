import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { AppError } from '../utils/errors.js';
import * as userModel from '../models/userModel.js';

dotenv.config();

export const authMiddleware = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new AppError('Authorization token missing', 401);
    }

    const token = authorization.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(payload.id);
    if (!user) {
      throw new AppError('User not found', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token', 401));
    }
    next(error);
  }
};
