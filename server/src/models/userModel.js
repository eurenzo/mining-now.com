import { query } from '../config/db.js';

export const create = async ({ name, email, password_hash, role = 'customer' }) => {
  const sql = `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`;
  const result = await query(sql, [name, email, password_hash, role]);
  return { id: result.insertId, name, email, role };
};

export const findByEmail = async (email) => {
  const sql = `SELECT * FROM users WHERE email = ?`;
  const rows = await query(sql, [email]);
  return rows[0] || null;
};

export const findById = async (id) => {
  const sql = `SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?`;
  const rows = await query(sql, [id]);
  return rows[0] || null;
};

export const findByIdWithPassword = async (id) => {
  const sql = `SELECT * FROM users WHERE id = ?`;
  const rows = await query(sql, [id]);
  return rows[0] || null;
};

export const findAll = async () => {
  const sql = `SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY created_at DESC`;
  return query(sql);
};

export const update = async (id, data) => {
  const allowedFields = ['name', 'email', 'role'];
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (!fields.length) return findById(id);

  values.push(id);
  const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  await query(sql, values);
  return findById(id);
};

export const remove = async (id) => {
  const sql = `DELETE FROM users WHERE id = ?`;
  return query(sql, [id]);
};
