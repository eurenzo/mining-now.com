import dotenv from 'dotenv';
import app from './src/app.js';
import { validateConfig } from './src/config/validation.js';
import { logger } from './src/config/logger.js';

dotenv.config();
validateConfig();

const PORT = process.env.PORT;

app.listen(PORT, () => {
  logger.info('Mining Now backend listening', {
    port: PORT,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
