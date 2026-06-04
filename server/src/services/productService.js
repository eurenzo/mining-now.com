import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import * as productModel from '../models/productModel.js';

export const listProducts = async ({ page, limit, search, brand }) => {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  
  const products = await productModel.findAll({ page, limit, search, brand });
  const total = await productModel.countAll({ search, brand });
  
  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getProduct = async (id) => {
  const product = await productModel.findById(id);
  if (!product) {
    throw new NotFoundError('Product');
  }
  return product;
};

export const createProduct = async (payload) => {
  if (!payload.name || !payload.brand || !payload.price) {
    throw new ValidationError('Missing required fields: name, brand, price');
  }
  return productModel.create(payload);
};

export const updateProduct = async (id, payload) => {
  const product = await productModel.findById(id);
  if (!product) {
    throw new NotFoundError('Product');
  }
  return productModel.update(id, payload);
};

export const deleteProduct = async (id) => {
  const product = await productModel.findById(id);
  if (!product) {
    throw new NotFoundError('Product');
  }
  await productModel.remove(id);
  return { message: 'Product deleted successfully' };
};
