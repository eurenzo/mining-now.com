/**
 * Environment variable validation using Zod
 * Fails fast at startup with type-safe validation
 */

import { z } from 'zod';

/**
 * CRITICAL FIX: JWT secret entropy validation
 * Ensures secrets are not weak or predictable
 */
const isStrongJwtSecret = (secret) => {
  if (typeof secret !== 'string' || secret.length < 32) {
    return false;
  }
  
  // Check for sufficient character diversity
  const hasUppercase = /[A-Z]/.test(secret);
  const hasLowercase = /[a-z]/.test(secret);
  const hasNumbers = /[0-9]/.test(secret);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(secret);
  const uniqueChars = new Set(secret).size;

  // Must have: uppercase, lowercase, numbers, special chars, and at least 15 unique chars
  return hasUppercase && hasLowercase && hasNumbers && hasSpecial && uniqueChars >= 15;
};

// Define environment schema with validation rules
const envSchema = z.object({
  // Database configuration
  DB_HOST: z.string().min(1, 'DB_HOST is required').default('127.0.0.1'),
  DB_USER: z.string().min(1, 'DB_USER is required').default('root'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required (cannot be empty in production)'),
  DB_NAME: z.string().min(1, 'DB_NAME is required').default('mining_shop'),
  DB_POOL_SIZE: z.coerce.number().int().min(5).max(200).default(50),
  DB_POOL_QUEUE: z.coerce.number().int().min(10).max(1000).default(100),

  // JWT configuration
  JWT_SECRET: z.string()
    .min(32, 'JWT_SECRET must be at least 32 characters')
    .refine(isStrongJwtSecret, 
      'JWT_SECRET must contain uppercase, lowercase, numbers, special characters, and 15+ unique characters'
    ),
  JWT_EXPIRES_IN: z.string().optional().default('7d'),

  // Server configuration
  PORT: z.coerce.number()
    .int('PORT must be an integer')
    .min(1, 'PORT must be at least 1')
    .max(65535, 'PORT must be at most 65535')
    .default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // CORS configuration
  ALLOWED_ORIGINS: z.string().optional().default('http://localhost:3000'),
  
  // Optional: Redis for caching
  REDIS_HOST: z.string().optional().default('localhost'),
  REDIS_PORT: z.coerce.number().int().optional().default(6379),
  REDIS_PASSWORD: z.string().optional(),
});

export function validateConfig() {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Environment validation failed:\n');
    
    // Format error messages
    const issues = parsed.error.issues;
    if (Array.isArray(issues)) {
      issues.forEach(issue => {
        const path = issue.path.join('.');
        console.error(`  • ${path}: ${issue.message}`);
      });
    } else {
      console.error(`  ${parsed.error.message}`);
    }
    
    console.error('\n📋 Required environment variables:');
    console.error('  - DB_HOST (default: 127.0.0.1)');
    console.error('  - DB_USER (default: root)');
    console.error('  - DB_PASSWORD (required, cannot be empty)');
    console.error('  - DB_NAME (default: mining_shop)');
    console.error('  - JWT_SECRET (required, must be ≥32 characters with uppercase, lowercase, numbers, special chars)');
    console.error('  - PORT (default: 4000, range: 1-65535)');
    console.error('  - NODE_ENV (default: development, options: development|production|test)');
    console.error('  - ALLOWED_ORIGINS (optional, default: http://localhost:3000)');
    console.error('  - DB_POOL_SIZE (optional, default: 50, range: 5-200)');
    console.error('  - DB_POOL_QUEUE (optional, default: 100, range: 10-1000)');
    
    process.exit(1);
  }
  
  const result = parsed.data;
  
  // Log validation success
  console.log('✓ Environment variables validated');
  console.log(`  NODE_ENV: ${result.NODE_ENV}`);
  console.log(`  PORT: ${result.PORT}`);
  console.log(`  DB_HOST: ${result.DB_HOST}`);
  console.log(`  DB_POOL_SIZE: ${result.DB_POOL_SIZE}`);
  console.log(`  DB_POOL_QUEUE: ${result.DB_POOL_QUEUE}`);
  
  return result;
}
