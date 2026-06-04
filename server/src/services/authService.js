import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger.js';
import { AuthenticationError, AuthorizationError, ConflictError } from '../utils/customErrors.js';
import * as userModel from '../models/userModel.js';

const SALT_ROUNDS = 12;

export const register = async ({ name, email, password }) => {
  const existingUser = await userModel.findByEmail(email);
  if (existingUser) {
    logger.warn('Registration attempt with existing email', { email });
    throw new ConflictError(`Email ${email} is already registered`);
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userModel.create({ name, email, password_hash });
  
  logger.info('User registered successfully', { 
    userId: user.id, 
    email: user.email 
  });
  
  return user;
};

export const login = async ({ email, password }) => {
  const user = await userModel.findByEmail(email);
  if (!user) {
    logger.warn('Login attempt with non-existent email', { email });
    throw new AuthenticationError('Invalid email or password');
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    logger.warn('Login attempt with incorrect password', { email });
    throw new AuthenticationError('Invalid email or password');
  }

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

  logger.info('User logged in successfully', { 
    userId: user.id, 
    email: user.email 
  });

  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

export const getProfile = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) {
    logger.error('User session invalid - user not found', { userId });
    throw new AuthenticationError('User session invalid');
  }
  return user;
};
