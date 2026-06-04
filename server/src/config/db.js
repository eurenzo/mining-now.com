import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

/**
 * CRITICAL FIX: Production-grade connection pool configuration
 * - Tuned for 50-100 concurrent connections
 * - Proper timeout configuration
 * - Queue management to prevent memory leaks
 * - Connection monitoring
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  
  // Connection pool tuning for production
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_SIZE || '50'),
  queueLimit: parseInt(process.env.DB_POOL_QUEUE || '100'),
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
  
  // Timeout configuration
  connectionTimeoutMillis: 10000,  // 10s to acquire connection
  idleTimeoutMillis: 30000,        // 30s before closing idle connection
  
  // MySQL specific optimizations
  dateStrings: true,
  timezone: 'UTC',
  supportBigNumbers: true,
  bigNumberStrings: true,
  decimalNumbers: true,  // CRITICAL: Handle DECIMAL properly
  
  // Connection parameters
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  authPlugins: {
    mysql_clear_password: () => () => process.env.DB_PASSWORD
  }
});

// Pool event monitoring
pool.on('connection', (connection) => {
  logger.debug('DB connection acquired', { 
    connectionId: connection.connectionId 
  });
});

pool.on('error', (error) => {
  logger.error('DB pool error', { 
    code: error.code,
    message: error.message,
    errno: error.errno
  });
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

/**
 * CRITICAL FIX: Health check for connection pool
 * Used by /ready endpoint
 */
export const poolHealthCheck = async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    return { healthy: true, connections: pool._allConnections?.length || 0 };
  } catch (error) {
    logger.error('Pool health check failed', { error: error.message });
    return { 
      healthy: false, 
      error: error.message 
    };
  }
};

export default pool;
