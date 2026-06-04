import { query } from '../config/db.js';

export const findByUser = async (userId, connection = null) => {
  const sql = `SELECT ci.id, ci.user_id, ci.product_id, ci.quantity, p.name, p.brand, p.price, p.stock_quantity, p.image_url, p.algorithm FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.user_id = ? ORDER BY ci.created_at DESC`;
  return query(sql, [userId], connection);
};

export const findItem = async (userId, productId) => {
  const sql = `SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?`;
  const rows = await query(sql, [userId, productId]);
  return rows[0] || null;
};

export const findById = async (id, userId) => {
  const sql = `SELECT ci.*, p.name, p.brand, p.price, p.stock_quantity FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = ? AND ci.user_id = ?`;
  const rows = await query(sql, [id, userId]);
  return rows[0] || null;
};

export const create = async (userId, productId, quantity) => {
  const sql = `INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)`;
  const result = await query(sql, [userId, productId, quantity]);
  return findById(result.insertId, userId);
};

export const update = async (id, userId, quantity) => {
  const sql = `UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`;
  await query(sql, [quantity, id, userId]);
  return findById(id, userId);
};

export const remove = async (id, userId) => {
  const sql = `DELETE FROM cart_items WHERE id = ? AND user_id = ?`;
  return query(sql, [id, userId]);
};

export const clear = async (userId, connection = null) => {
  const sql = `DELETE FROM cart_items WHERE user_id = ?`;
  return query(sql, [userId], connection);
};
