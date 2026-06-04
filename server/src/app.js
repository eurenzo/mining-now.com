import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { requestSizeLimiter } from './middleware/requestSizeMiddleware.js';
import { sanitizeInputs } from './middleware/sanitizeMiddleware.js';
import { loggerMiddleware } from './middleware/loggerMiddleware.js';
import { apiLimiter } from './middleware/rateLimitMiddleware.js';
import pool from './config/db.js';
import { logger } from './config/logger.js';

dotenv.config();

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(loggerMiddleware);
app.use(requestSizeLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInputs);

// Health checks BEFORE rate limiting (for monitoring)
// Root-level endpoints for container orchestration (Docker, K8s)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime_seconds: process.uptime()
  });
});

app.get('/ready', async (req, res) => {
  try {
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
      error: error.message
    });
    
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// API v1 endpoints (also supported for backward compatibility)
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime_seconds: process.uptime()
  });
});

app.get('/api/v1/ready', async (req, res) => {
  try {
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
      error: error.message
    });
    
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// CRITICAL FIX 6: Apply global rate limiting to ALL routes
// This ensures ALL endpoints are protected by default
app.use('/api/v1', apiLimiter, routes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

export default app;
