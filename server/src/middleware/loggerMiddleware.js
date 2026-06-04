/**
 * Express middleware for structured request logging
 */

import { logger } from '../config/logger.js';

export function loggerMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Override res.end to capture response
  const originalEnd = res.end;
  
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      query: req.query,
      status: res.statusCode,
      duration_ms: duration,
      ip: req.ip,
      user_id: req.user?.id || 'anonymous'
    });
    
    originalEnd.apply(res, args);
  };
  
  next();
}
