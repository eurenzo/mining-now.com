import { query, getConnection } from '../config/db.js';

export const create = async (userId, totalAmount, status = 'pending', connection = null) => {
  const sql = `INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)`;
  const result = await query(sql, [userId, totalAmount, status], connection);
  const rows = await query(`SELECT * FROM orders WHERE id = ?`, [result.insertId], connection);
  return rows[0];
};

export const findById = async (orderId, connection = null) => {
  const sql = `SELECT * FROM orders WHERE id = ?`;
  const rows = await query(sql, [orderId], connection);
  return rows[0] || null;
};

export const findAll = async (userId, isAdmin, page = 1, limit = 20, connection = null) => {
  const offset = (page - 1) * limit;
  const sql = isAdmin 
    ? `SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?` 
    : `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  
  if (isAdmin) {
    return query(sql, [limit, offset], connection);
  }
  return query(sql, [userId, limit, offset], connection);
};

export const count = async (userId, isAdmin, connection = null) => {
  const sql = isAdmin ? `SELECT COUNT(*) as total FROM orders` : `SELECT COUNT(*) as total FROM orders WHERE user_id = ?`;
  const rows = await query(sql, isAdmin ? [] : [userId], connection);
  return rows[0]?.total || 0;
};

export const findForUser = async (orderId, userId, isAdmin, connection = null) => {
  if (isAdmin) {
    return findById(orderId, connection);
  }
  const sql = `SELECT * FROM orders WHERE id = ? AND user_id = ?`;
  const rows = await query(sql, [orderId, userId], connection);
  return rows[0] || null;
};

export const updateStatus = async (orderId, status, connection = null) => {
  const sql = `UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  await query(sql, [status, orderId], connection);
  return findById(orderId, connection);
};

export const createItem = async (orderId, productId, quantity, priceAtPurchase, connection = null) => {
  const sql = `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)`;
  await query(sql, [orderId, productId, quantity, priceAtPurchase], connection);
};

export const itemsByOrder = async (orderId, connection = null) => {
  const sql = `SELECT oi.id, oi.product_id, p.name, p.brand, oi.quantity, oi.price_at_purchase, p.algorithm FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`;
  return query(sql, [orderId], connection);
};

export const transaction = async () => {
  const connection = await getConnection();
  await connection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
  await connection.beginTransaction();
  return connection;
};

export const commit = async (connection) => {
  try {
    await connection.commit();
  } finally {
    connection.release();
  }
};

export const rollback = async (connection) => {
  try {
    await connection.rollback();
  } finally {
    connection.release();
  }
};

export const withTransaction = async (callback) => {
  const connection = await transaction();
  try {
    const result = await callback(connection);
    await commit(connection);
    return result;
  } catch (error) {
    await rollback(connection);
    throw error;
  }
};
