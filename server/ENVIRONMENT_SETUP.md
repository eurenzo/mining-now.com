# Environment Variables Setup Guide

## ⚠️ SECURITY NOTICE

This project uses environment variables to manage sensitive credentials. **Never commit `.env` files or secrets to version control.**

## Required Environment Variables

All sensitive credentials are loaded from environment variables at startup. Missing or invalid values will cause the application to fail with clear error messages.

### Database Configuration

```bash
DB_HOST=127.0.0.1          # MySQL host (default: 127.0.0.1)
DB_USER=root               # MySQL user (default: root)
DB_PASSWORD=               # REQUIRED: MySQL password (cannot be empty)
DB_NAME=mining_shop        # Database name (default: mining_shop)
```

### JWT Configuration

```bash
JWT_SECRET=                # REQUIRED: At least 32 characters
JWT_EXPIRES_IN=7d          # Token expiration time (default: 7d)
```

### Server Configuration

```bash
PORT=4000                  # Server port (default: 4000, range: 1-65535)
NODE_ENV=development       # Environment (development|production|test)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173  # CORS origins
```

### Admin Seed Credentials

```bash
ADMIN_EMAIL=admin@miningnow.com    # Admin email (optional, default: admin@miningnow.com)
ADMIN_PASSWORD=                     # REQUIRED: Admin password for seeding
```

## Quick Start

### 1. Create .env file (Development)

```bash
cp .env.example .env
```

Then edit `.env` with your actual values:

```bash
DB_PASSWORD=your_secure_password_here
JWT_SECRET=your_very_long_secret_key_at_least_32_characters
ADMIN_PASSWORD=admin_secure_password
```

### 2. Validate Environment

The application validates all environment variables at startup:

```bash
npm start
```

If validation fails, you'll see clear error messages indicating which variables are missing or invalid.

### 3. Seed Database (Optional)

```bash
ADMIN_PASSWORD=admin_secure_password npm run seed
```

## Security Best Practices

✅ **DO:**
- Store `.env` in a secure secrets manager in production (AWS Secrets Manager, Vault, etc.)
- Use strong, randomly generated passwords
- Rotate `JWT_SECRET` periodically
- Keep `JWT_SECRET` at least 32 characters
- Use environment-specific values for each deployment

❌ **DON'T:**
- Commit `.env` files to version control
- Hardcode secrets in code
- Share `.env` files via email or chat
- Use the same `JWT_SECRET` across environments
- Use weak or predictable passwords

## Environment Variables in Production

### Docker

Pass environment variables at runtime:

```bash
docker run \
  -e DB_HOST=prod-db.example.com \
  -e DB_USER=app_user \
  -e DB_PASSWORD=secure_password \
  -e DB_NAME=mining_shop_prod \
  -e JWT_SECRET=production_secret_key_32_chars_minimum \
  -e NODE_ENV=production \
  -e PORT=3000 \
  mining-now-backend
```

### Kubernetes

Use Kubernetes Secrets:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mining-backend-secrets
type: Opaque
data:
  DB_PASSWORD: <base64-encoded-password>
  JWT_SECRET: <base64-encoded-secret>
  ADMIN_PASSWORD: <base64-encoded-admin-password>
---
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: backend
    env:
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: mining-backend-secrets
          key: DB_PASSWORD
    - name: JWT_SECRET
      valueFrom:
        secretKeyRef:
          name: mining-backend-secrets
          key: JWT_SECRET
```

### Environment Variable Validation

The application uses **Zod** for type-safe environment validation:

- ✅ Type checking (string, number, enum)
- ✅ Range validation (PORT: 1-65535)
- ✅ Length validation (JWT_SECRET: ≥32 chars)
- ✅ Required/optional fields
- ✅ Helpful error messages on startup

Validation happens automatically when the server starts. If any validation fails, the application exits with error code 1 and displays a detailed error message.

## Checking Current Configuration

View what was loaded from environment:

```bash
# Not recommended in production, but shows what's validated
node -e "
import('./src/config/validation.js').then(mod => mod.validateConfig()).catch(() => {})
"
```

This will output something like:

```
✓ Environment variables validated
  NODE_ENV: development
  PORT: 4000
  DB_HOST: 127.0.0.1
```

## Troubleshooting

### "Missing required environment variables"

**Solution:** Check `.env` file exists and contains all required variables. Use `.env.example` as a template.

### "JWT_SECRET must be at least 32 characters"

**Solution:** Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### "DB_PASSWORD: Invalid input: expected string, received undefined"

**Solution:** Set DB_PASSWORD in `.env`:

```bash
DB_PASSWORD=your_database_password
```

### "Invalid option: expected one of 'development'|'production'|'test'"

**Solution:** NODE_ENV must be one of: `development`, `production`, or `test`

## See Also

- [.env.example](.env.example) - Template environment variables
- [src/config/validation.js](src/config/validation.js) - Validation schema using Zod
