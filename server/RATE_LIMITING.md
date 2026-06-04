# Rate Limiting Strategy

## Overview

The Mining Now backend implements a multi-tier rate limiting strategy to protect against abuse, DoS attacks, and ensure fair resource allocation.

## Rate Limiting Tiers

### 1. **Auth Limiter** (Login/Register)
- **Limit:** 5 requests per 15 minutes per IP
- **Applied to:** 
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
- **Purpose:** Prevents brute force attacks on authentication endpoints
- **Environment Variable:** `AUTH_RATE_LIMIT` (default: 5)

### 2. **General API Limiter** (Standard Operations)
- **Limit:** 100 requests per 15 minutes per IP
- **Applied to:**
  - `GET /api/v1/products/*` - Product listing and retrieval
  - `POST /api/v1/cart/*` - Cart operations
  - `GET/POST /api/v1/orders/*` - Order operations
  - `GET /api/v1/users/*` - User operations (admin only)
  - `POST /api/v1/products/*` - Product creation (admin only)
  - `PUT /api/v1/products/*` - Product updates (admin only)
  - `PATCH /api/v1/orders/:id/status` - Order status changes (admin only)
- **Purpose:** Protects against general API abuse
- **Environment Variable:** `API_RATE_LIMIT` (default: 100)

### 3. **Strict Limiter** (Available for Sensitive Operations)
- **Limit:** 20 requests per 15 minutes per IP
- **Purpose:** Can be applied to delete operations or other sensitive actions
- **Environment Variable:** `STRICT_RATE_LIMIT` (default: 20)

### 4. **Read Limiter** (Available for Read-Heavy Operations)
- **Limit:** 200 requests per 15 minutes per IP
- **Purpose:** More permissive for read-only operations that don't modify data
- **Environment Variable:** `READ_RATE_LIMIT` (default: 200)

### 5. **Create Limiter** (Available for Resource Creation)
- **Limit:** 50 requests per 15 minutes per IP
- **Purpose:** Moderate limit for POST operations that create resources
- **Environment Variable:** `CREATE_RATE_LIMIT` (default: 50)

## Protected Routes

### Authentication Routes
```
POST   /api/v1/auth/register          → authLimiter (5/15min)
POST   /api/v1/auth/login             → authLimiter (5/15min)
GET    /api/v1/auth/me                → apiLimiter (100/15min)
```

### Product Routes
```
GET    /api/v1/products               → apiLimiter (100/15min)
GET    /api/v1/products/:id           → apiLimiter (100/15min)
POST   /api/v1/products               → apiLimiter (admin only)
PUT    /api/v1/products/:id           → apiLimiter (admin only)
DELETE /api/v1/products/:id           → apiLimiter (admin only)
```

### Cart Routes
```
GET    /api/v1/cart                   → apiLimiter (100/15min)
POST   /api/v1/cart/items             → apiLimiter (100/15min)
PUT    /api/v1/cart/items/:id         → apiLimiter (100/15min)
DELETE /api/v1/cart/items/:id         → apiLimiter (100/15min)
DELETE /api/v1/cart/clear             → apiLimiter (100/15min)
```

### Order Routes
```
GET    /api/v1/orders                 → apiLimiter (100/15min)
POST   /api/v1/orders                 → apiLimiter (100/15min, checkout)
GET    /api/v1/orders/:id             → apiLimiter (100/15min)
PATCH  /api/v1/orders/:id/status      → apiLimiter (admin only)
```

### User Routes
```
GET    /api/v1/users                  → apiLimiter (admin only)
GET    /api/v1/users/:id              → apiLimiter (admin only)
PUT    /api/v1/users/:id              → apiLimiter (admin only)
DELETE /api/v1/users/:id              → apiLimiter (admin only)
```

### Health Check Routes (No Rate Limiting)
```
GET    /health                        → No limit (monitoring)
GET    /ready                         → No limit (monitoring)
GET    /api/v1/health                 → No limit (monitoring)
GET    /api/v1/ready                  → No limit (monitoring)
```

## Configuration

### Development Environment
```bash
AUTH_RATE_LIMIT=5         # 5 attempts per 15 min
API_RATE_LIMIT=100        # 100 requests per 15 min
STRICT_RATE_LIMIT=20      # 20 sensitive ops per 15 min
CREATE_RATE_LIMIT=50      # 50 creates per 15 min
READ_RATE_LIMIT=200       # 200 reads per 15 min
```

### Production Environment (Recommended)
```bash
AUTH_RATE_LIMIT=5         # Keep strict for security
API_RATE_LIMIT=100        # Adjust based on traffic
STRICT_RATE_LIMIT=10      # Stricter for production
CREATE_RATE_LIMIT=30      # Lower for resource protection
READ_RATE_LIMIT=300       # Higher for read operations
```

### High-Traffic Production (Adjust as needed)
```bash
AUTH_RATE_LIMIT=10        # Slightly higher if legitimate traffic high
API_RATE_LIMIT=200        # Increase if hitting limits
STRICT_RATE_LIMIT=20      # Keep moderate
CREATE_RATE_LIMIT=50      # Increase for bulk imports
READ_RATE_LIMIT=500       # Increase for analytics queries
```

## Response Format

When rate limit is exceeded, the client receives:

```json
HTTP/1.1 429 Too Many Requests

{
  "error": "Too many requests, please try again later"
}
```

Response headers include rate limit information:
```
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 1623456789
```

## IP Detection

Rate limiting uses the client's IP address for tracking:

- **Direct connections:** Uses `req.ip` (actual client IP)
- **Behind proxy/load balancer:** Ensure `X-Forwarded-For` header is properly set
- **Docker/K8s:** Configure reverse proxy to pass client IP via headers

### Example Nginx Configuration
```nginx
server {
    listen 80;
    
    location / {
        proxy_pass http://backend:4000;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Security Considerations

### Brute Force Protection
- Auth endpoints have stricter limits (5/15min)
- Attackers hitting rate limit get logged
- Consider temporary IP blocking for repeated violations (future feature)

### Resource Exhaustion Protection
- General API limited to 100 requests per 15 min
- Prevents single user/bot from consuming all resources
- Fair allocation across users

### DDoS Mitigation
- Rate limiting helps but is not sufficient for large DDoS
- Should be combined with:
  - WAF (Web Application Firewall)
  - Cloud DDoS protection (Cloudflare, AWS Shield)
  - Load balancer rate limiting
  - Geographic IP filtering

## Monitoring

### Health Checks (Excluded from Rate Limiting)
- `/health` - No rate limit
- `/ready` - No rate limit
- `/api/v1/health` - No rate limit
- `/api/v1/ready` - No rate limit

These endpoints are safe to call frequently for monitoring.

### Recommended Monitoring
1. Track 429 (Too Many Requests) responses
2. Log IP addresses hitting rate limits
3. Alert on unusual patterns (potential attacks)
4. Adjust limits based on legitimate traffic patterns

## Implementation Details

### Middleware Stack (Per Route Group)

1. **Auth Routes** (`src/routes/authRoutes.js`)
   ```javascript
   router.post('/register', authLimiter, ...)
   router.post('/login', authLimiter, ...)
   ```

2. **Product Routes** (`src/routes/productRoutes.js`)
   ```javascript
   router.use(apiLimiter)  // Applied to entire router
   ```

3. **Cart Routes** (`src/routes/cartRoutes.js`)
   ```javascript
   router.use(apiLimiter)  // Applied to entire router
   ```

4. **Order Routes** (`src/routes/orderRoutes.js`)
   ```javascript
   router.use(apiLimiter)  // Applied to entire router
   ```

5. **User Routes** (`src/routes/userRoutes.js`)
   ```javascript
   router.use(apiLimiter)  // Applied to entire router
   ```

### Middleware Configuration
See `src/middleware/rateLimitMiddleware.js` for configuration details:
- Express-rate-limit library with standard/legacy headers disabled
- IP-based key generation
- Health check endpoints skipped

## Troubleshooting

### Users Getting Rate Limited Too Quickly
1. Check if legitimate traffic is higher than expected
2. Increase `API_RATE_LIMIT` environment variable
3. Review IP detection (might be grouping multiple users)
4. Check for misbehaving client code

### Rate Limiting Not Working
1. Verify middleware is imported and applied
2. Check health check endpoints aren't catching legitimate routes
3. Ensure IP detection is correct for your proxy setup
4. Check logs for rate limit violations

### Behind Load Balancer/Proxy
1. All users behind proxy appear as same IP
2. Need reverse proxy to pass `X-Forwarded-For` header
3. Configure Express to trust proxy:
   ```javascript
   app.set('trust proxy', 1); // Trust first proxy
   ```

## Future Enhancements

1. **User-Based Rate Limiting** - Rate limit per user ID (authenticated) instead of IP
2. **Adaptive Rate Limiting** - Adjust limits based on server load
3. **IP Reputation** - Stricter limits for known malicious IPs
4. **Circuit Breaker** - Temporarily block IPs with extreme violations
5. **Rate Limit Bypass** - Whitelist internal services/IPs

## See Also

- [src/middleware/rateLimitMiddleware.js](src/middleware/rateLimitMiddleware.js) - Rate limiting configuration
- [.env.example](.env.example) - Environment variable templates
- Express-rate-limit documentation: https://github.com/nfriedly/express-rate-limit
