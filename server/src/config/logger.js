/**
 * Structured logging configuration
 * Simple implementation without external dependencies
 */

const LOG_LEVELS = {
  error: 'ERROR',
  warn: 'WARN',
  info: 'INFO',
  debug: 'DEBUG'
};

function formatTimestamp() {
  return new Date().toISOString();
}

function formatLog(level, message, meta = {}) {
  const log = {
    timestamp: formatTimestamp(),
    level,
    message,
    ...meta
  };
  return JSON.stringify(log);
}

export const logger = {
  error: (message, meta = {}) => {
    console.error(formatLog(LOG_LEVELS.error, message, meta));
  },
  warn: (message, meta = {}) => {
    console.warn(formatLog(LOG_LEVELS.warn, message, meta));
  },
  info: (message, meta = {}) => {
    console.log(formatLog(LOG_LEVELS.info, message, meta));
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatLog(LOG_LEVELS.debug, message, meta));
    }
  }
};
