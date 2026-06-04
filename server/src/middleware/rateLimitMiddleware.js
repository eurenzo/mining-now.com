import rateLimit from 'express-rate-limit';

/**
 * Rate limiting middleware strategies for production
 * 
 * Based on request type and endpoint sensitivity
 */

// Helper function to skip health check endpoints
const skipHealthChecks = (req) => {
  return req.path === '/health' || req.path === '/ready' || 
         req.path === '/api/v1/health' || req.path === '/api/v1/ready';
};

/**
 * Auth Limiter - Strict rate limiting for login/register
 * Prevents brute force attacks on authentication endpoints
 * 
 * Default: 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.AUTH_RATE_LIMIT || 5,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true, // Include rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skip: skipHealthChecks,
  keyGenerator: (req) => {
    // Use IP for rate limiting
    return req.ip || req.connection.remoteAddress;
  }
});

/**
 * General API Limiter - Standard rate limiting for most endpoints
 * 
 * Default: 100 requests per 15 minutes per IP
 * Protects against abuse while allowing normal usage
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.API_RATE_LIMIT || 100,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipHealthChecks,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  }
});

/**
 * Strict Limiter - Very strict rate limiting for sensitive operations
 * Used for: delete operations, admin actions, data modifications
 * 
 * Default: 20 requests per 15 minutes per IP
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.STRICT_RATE_LIMIT || 20,
  message: 'Too many sensitive operations, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipHealthChecks,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  }
});

/**
 * Create Rate Limiter - For resource creation (POST requests)
 * Default: 50 requests per 15 minutes per IP
 */
export const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.CREATE_RATE_LIMIT || 50,
  message: 'Too many creation requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipHealthChecks,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  }
});

/**
 * Read Limiter - For read operations (GET requests)
 * More permissive than writes since reads don't modify data
 * Default: 200 requests per 15 minutes per IP
 */
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.READ_RATE_LIMIT || 200,
  message: 'Too many read requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipHealthChecks,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  }
});

