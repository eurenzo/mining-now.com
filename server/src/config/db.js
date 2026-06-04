import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mining_shop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

export const query = async (sql, params = [], connection = null) => {
  if (connection) {
    const [rows] = await connection.execute(sql, params);
    return rows;
  }

  const [rows] = await pool.execute(sql, params);
  return rows;
};

export const getConnection = async () => pool.getConnection();

export default pool;
