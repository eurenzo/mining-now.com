/**
 * Health check routes
 * GET /api/v1/health - Application health status
 * GET /api/v1/ready - Readiness check (DB connectivity)
 */

import express from 'express';
import { pool } from '../config/db.js';
import { logger } from '../config/logger.js';

const router = express.Router();

/**
 * GET /health
 * Basic liveness probe - verifies app is running
 * Used by: container orchestration (Docker, K8s)
 * Response: 200 OK with uptime and status
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime_seconds: process.uptime()
  });
});

/**
 * GET /ready
 * Readiness probe - verifies dependencies are operational
 * Used by: load balancers, traffic routers
 * Checks: Database connectivity
 */
router.get('/ready', async (req, res) => {
  try {
    // Test database connectivity
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    logger.error('Readiness check failed', {
      error: error.message,
      code: error.code
    });
    
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

export default router;
