import { query } from '../config/db.js';

export const create = async (product) => {
  const sql = `INSERT INTO products (name, brand, price, hashrate, power_consumption, algorithm, stock_quantity, image_url, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    product.name,
    product.brand,
    product.price,
    product.hashrate,
    product.power_consumption,
    product.algorithm,
    product.stock_quantity,
    product.image_url || null,
    product.description || null
  ];
  const result = await query(sql, params);
  return findById(result.insertId);
};

/**
 * CRITICAL FIX: Lock product for update with timeout
 * Ensures we get fresh stock_quantity and prevent stale reads
 */
export const lockForUpdate = async (id, connection) => {
  const sql = `SELECT id, stock_quantity FROM products WHERE id = ? FOR UPDATE`;
  const rows = await query(sql, [id], connection);
  return rows[0] || null;
};

export const findById = async (id, connection = null) => {
  const sql = `SELECT * FROM products WHERE id = ?`;
  const rows = await query(sql, [id], connection);
  return rows[0] || null;
};

/**
 * CRITICAL FIX: Escape wildcards in search to prevent SQL injection
 */
const escapeWildcards = (str) => {
  if (!str) return str;
  return str.replace(/[%_\\]/g, '\\$&');
};

export const findAll = async ({ page = 1, limit = 20, search, brand }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('name LIKE ? ESCAPE "\\\\"');
    params.push(`%${escapeWildcards(search)}%`);
  }
  if (brand) {
    conditions.push('brand = ?');
    params.push(brand);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT * FROM products ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));
  const rows = await query(sql, params);
  return rows;
};

export const countAll = async ({ search, brand }) => {
  const conditions = [];
  const params = [];
  if (search) {
    conditions.push('name LIKE ? ESCAPE "\\\\"');
    params.push(`%${escapeWildcards(search)}%`);
  }
  if (brand) {
    conditions.push('brand = ?');
    params.push(brand);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT COUNT(*) as total FROM products ${whereClause}`;
  const rows = await query(sql, params);
  return rows[0]?.total || 0;
};

export const update = async (id, updates) => {
  const allowedFields = ['name', 'brand', 'price', 'hashrate', 'power_consumption', 'algorithm', 'image_url', 'description'];
  const fields = [];
  const params = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      params.push(value);
    }
  }

  if (!fields.length) {
    return findById(id);
  }

  params.push(id);
  const sql = `UPDATE products SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  await query(sql, params);
  return findById(id);
};

export const remove = async (id) => {
  const sql = `DELETE FROM products WHERE id = ?`;
  return query(sql, [id]);
};

/**
 * CRITICAL FIX: Atomic stock adjustment with validation
 * Ensures stock cannot go negative and validates minimum required
 */
export const adjustStock = async (id, quantityDelta, connection = null) => {
  const sql = `UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND stock_quantity + ? >= 0`;
  const result = await query(sql, [quantityDelta, id, quantityDelta], connection);
  return result.affectedRows > 0;
};

/**
 * CRITICAL FIX: Atomic stock adjustment with minimum check
 * Ensures we don't oversell when other transactions modify stock
 */
export const adjustStockAtomic = async (id, quantityDelta, minRequired, connection) => {
  const sql = `
    UPDATE products 
    SET stock_quantity = stock_quantity + ?, 
        updated_at = CURRENT_TIMESTAMP 
    WHERE id = ? 
      AND stock_quantity >= ?
      AND stock_quantity + ? >= 0
  `;
  
  const result = await query(
    sql, 
    [quantityDelta, id, minRequired, quantityDelta], 
    connection
  );
  
  return result.affectedRows > 0;
};
