# Security

BaR ships with API-safe security defaults. This page covers automatic header injection, cookie security, and production hardening.

---

## Default Security Headers

When using `BarExpressAdapter`, security headers are injected on **every request** unless explicitly disabled.

```typescript
const bar = new BarExpressAdapter();
app.use(bar.handler());
```

Headers are applied by default because the adapter treats `withDefaultHeaders !== false` as enabled.

To disable:

```typescript
const bar = new BarExpressAdapter({ withDefaultHeaders: false });
```

### Injected Headers

BaR exports the full set as `DEFAULT_SECURITY_HEADERS`:

```typescript
import { DEFAULT_SECURITY_HEADERS } from '@vorlaxen-labs/bar-js';
```

| Header | Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `X-Frame-Options` | `DENY` | Prevents clickjacking via iframes |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer information |
| `Content-Security-Policy` | `default-src 'none'; frame-ancestors 'none';` | API-safe CSP — no inline scripts |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates browsing context |
| `Cache-Control` | `no-store` | Prevents caching of API responses |
| `Pragma` | `no-cache` | Legacy cache fallback |
| `X-DNS-Prefetch-Control` | `off` | Disables DNS prefetching |

---

## Custom Default Headers

Replace or extend the default set:

```typescript
const bar = new BarExpressAdapter({
  defaultHeaders: {
    ...DEFAULT_SECURITY_HEADERS,
    'X-API-Gateway': 'vorlaxen-prod',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  },
});
```

Route-level headers from `.setHeaders()` override adapter defaults when keys collide.

---

## Cache Control Strategy

| Endpoint type | Recommended `Cache-Control` |
|---|---|
| Auth, mutations | `no-store` (default) |
| Public static config | `public, max-age=3600` |
| User-specific data | `private, no-cache` |
| Health checks | `no-store` |

```typescript
app.get('/api/config/public', (req, res) => {
  return res.builder
    .as.ok(publicConfig)
    .setHeaders('Cache-Control', 'public, max-age=86400')
    .build();
});
```

---

## Cookie Security

### Production Auth Cookie

```typescript
res.builder
  .as.created({ accessToken }, 'Authenticated')
  .setCookies('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  .build();
```

### SameSite Guidelines

| Value | Use when |
|---|---|
| `'strict'` | Same-origin API and frontend |
| `'lax'` | Top-level navigation from external links |
| `'none'` | Cross-origin requests (requires `secure: true`) |

### Cross-Origin Auth (SPA + API on different domains)

```typescript
.setCookies('refreshToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
})
```

---

## Production Environment Hardening

Configure the adapter for production:

```typescript
const bar = new BarExpressAdapter({
  withDefaultHeaders: true,
  environment: 'production',
  logger: pinoLogger,
});
```

This enables:

- **Error message masking** in `wrap()` — clients see `"Internal Server Error"`
- **Structured logging** via the configured logger
- **Security headers** on every response

Never enable `includeStack: true` in production:

```typescript
const bar = new BarExpressAdapter({
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  includeStack: process.env.NODE_ENV !== 'production',
});
```

---

## Request ID Security

`request_id` is a correlation identifier, not a secret:

- Safe to return to clients in error responses
- Safe to log in plain text
- Must not be used for authentication or authorization

---

## Helmet Integration

BaR's default headers complement [Helmet](https://helmetjs.github.io/) middleware. When using both, register Helmet before BaR and avoid duplicate headers:

```typescript
app.use(helmet());
app.use(bar.handler());
```

If Helmet already sets `X-Content-Type-Options`, BaR's value takes precedence (applied later on the response object).

---

## CORS Considerations

BaR does not handle CORS — configure it separately. Ensure CORS middleware runs before BaR:

```typescript
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(bar.handler());
```

When using credentials (cookies), set `sameSite: 'none'` and `secure: true` on cookies.

---

## Security Checklist

- [ ] `environment: 'production'` in production deployments
- [ ] `withDefaultHeaders: true` (default behavior)
- [ ] Auth cookies: `httpOnly`, `secure`, appropriate `sameSite`
- [ ] Rate limiting on auth endpoints (return `.as.tooManyRequests()`)
- [ ] No stack traces exposed to clients in production
- [ ] `request_id` logged on all 4xx/5xx responses
- [ ] HSTS header added at load balancer or via `defaultHeaders`

> **INFO:**
