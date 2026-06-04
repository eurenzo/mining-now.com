import { NotFoundError } from '../utils/customErrors.js';
import * as userModel from '../models/userModel.js';

export const listUsers = async () => {
  return userModel.findAll();
};

export const getUser = async (id) => {
  const user = await userModel.findById(id);
  if (!user) {
    throw new NotFoundError('User');
  }
  return user;
};

export const updateUser = async (id, payload) => {
  const user = await userModel.findById(id);
  if (!user) {
    throw new NotFoundError('User');
  }
  return userModel.update(id, payload);
};

export const deleteUser = async (id) => {
  const user = await userModel.findById(id);
  if (!user) {
    throw new NotFoundError('User');
  }
  await userModel.remove(id);
  return { message: 'User deleted successfully' };
};
