import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { query } from './src/config/db.js';
import { logger } from './src/config/logger.js';

dotenv.config();

// Load from environment, with validation
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@miningnow.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  logger.error('ADMIN_PASSWORD environment variable is not set');
  logger.error('Please set ADMIN_PASSWORD before running seed');
  process.exit(1);
}

const products = [
  {
    name: 'Antminer S19 Pro',
    brand: 'Bitmain',
    price: 4500.0,
    hashrate: '110 TH/s',
    power_consumption: 3250,
    algorithm: 'SHA-256',
    stock_quantity: 10,
    image_url: 'https://example.com/antminer-s19.jpg',
    description: 'High-performance Bitcoin miner with 110 TH/s hashrate.'
  },
  {
    name: 'Whatsminer M50S',
    brand: 'MicroBT',
    price: 5200.0,
    hashrate: '126 TH/s',
    power_consumption: 3276,
    algorithm: 'SHA-256',
    stock_quantity: 8,
    image_url: 'https://example.com/whatsminer-m50s.jpg',
    description: 'Efficient, durable miner for large-scale deployments.'
  },
  {
    name: 'Antminer L7',
    brand: 'Bitmain',
    price: 9500.0,
    hashrate: '9.5 GH/s',
    power_consumption: 3425,
    algorithm: 'Scrypt',
    stock_quantity: 5,
    image_url: 'https://example.com/antminer-l7.jpg',
    description: 'Top-tier Litecoin and Dogecoin miner.'
  }
];

const runSeed = async () => {
  try {
    const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const [existingAdmin] = await query('SELECT id FROM users WHERE email = ?', [ADMIN_EMAIL]);
    if (!existingAdmin) {
      await query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['Admin User', ADMIN_EMAIL, password_hash, 'admin']
      );
      logger.info('Admin user created', { email: ADMIN_EMAIL });
    } else {
      logger.info('Admin user already exists', { email: ADMIN_EMAIL });
    }

    for (const product of products) {
      const [existing] = await query('SELECT id FROM products WHERE name = ?', [product.name]);
      if (!existing) {
        await query(
          'INSERT INTO products (name, brand, price, hashrate, power_consumption, algorithm, stock_quantity, image_url, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            product.name,
            product.brand,
            product.price,
            product.hashrate,
            product.power_consumption,
            product.algorithm,
            product.stock_quantity,
            product.image_url,
            product.description
          ]
        );
        logger.info('Product inserted', { productName: product.name });
      } else {
        logger.info('Product already exists', { productName: product.name });
      }
    }

    logger.info('Seed complete');
    process.exit(0);
  } catch (error) {
    logger.error('Seed error', { 
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

runSeed();
