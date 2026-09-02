# Cookies & Headers

BaR provides first-class support for response headers and cookies through the builder chain. Both are applied by the dispatcher when `.build()` is called.

---

## Response Headers

### Single Header

```typescript
res.builder
  .as.ok(data)
  .setHeaders('X-RateLimit-Remaining', '42')
  .build();
```

### Header Alias

`header()` is an alias for `setHeaders()` with a single key-value pair:

```typescript
res.builder
  .as.ok(data)
  .header('X-App-Version', '2.0.0')
  .build();
```

### Multiple Headers

Pass an object to set several headers at once:

```typescript
res.builder
  .as.ok(data)
  .setHeaders({
    'X-Service': 'auth',
    'X-Env': 'production',
    'X-Cache': 'MISS',
  })
  .build();
```

Both overloads can be mixed in the same chain:

```typescript
res.builder
  .as.ok(data)
  .setHeaders('X-First', '1')
  .setHeaders({ 'X-Second': '2', 'X-Third': '3' })
  .build();
```

### Header Value Types

```typescript
type HeaderValue = string | number | readonly string[];
```

---

## Common Header Patterns

### Rate Limiting

```typescript
return res.builder
  .as.ok(data)
  .setHeaders({
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(resetTimestamp),
  })
  .build();
```

### Rate Limit Exceeded

```typescript
return res.builder
  .as.tooManyRequests('Rate limit exceeded')
  .setHeaders('Retry-After', '60')
  .build();
```

### Cache Control (Override Default)

BaR injects `Cache-Control: no-store` by default. Override for cacheable GET endpoints:

```typescript
return res.builder
  .as.ok(staticConfig)
  .setHeaders('Cache-Control', 'public, max-age=3600')
  .build();
```

### Authentication Challenge

```typescript
return res.builder
  .as.unauthorized('Token expired')
  .setHeaders('WWW-Authenticate', 'Bearer realm="api", error="invalid_token"')
  .build();
```

### Versioning

```typescript
return res.builder
  .as.ok(data)
  .setHeaders('X-API-Version', 'v1')
  .build();
```

---

## Cookies

### Single Cookie with Options

```typescript
return res.builder
  .as.created({ user }, 'Login successful')
  .setCookies('session', sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  .build();
```

### Cookie Options

```typescript
interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
}
```

### Multiple Cookies (Object Shorthand)

```typescript
return res.builder
  .as.ok(data)
  .setCookies({ theme: 'dark', lang: 'en' })
  .build();
```

Object shorthand does not set security options. Use the full signature for sensitive cookies.

### Multiple Cookies with Shared Options

```typescript
return res.builder
  .as.ok(data)
  .setCookies(
    { pref_a: '1', pref_b: '2' },
    { httpOnly: true, secure: true, sameSite: 'lax' }
  )
  .build();
```

---

## Auth Cookie Pattern

Real-world sign-in flow combining Express `res.cookie()` with BaR response:

```typescript
app.post('/api/auth/sign-in', async (req, res) => {
  const result = await authService.signIn(req.body);

  if ('tokens' in result) {
    res.cookie('refreshToken', result.tokens.refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  return res.builder.as.ok(result, 'Sign in successful').build();
});
```

> **INFO:** 
---

## Session Termination

Clear cookies on logout:

```typescript
app.post('/api/auth/sign-out', (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return res.builder
    .as.ok({ message: 'Session terminated' })
    .build();
});
```

---

## Default Headers vs. Custom Headers

The Express adapter injects [default security headers](reference/security.md) on every request. Custom headers from `.setHeaders()` are merged on top — **custom values override defaults** when keys collide.

```
Adapter defaults:  Cache-Control: no-store
Route override:    Cache-Control: public, max-age=60
Final response:    Cache-Control: public, max-age=60
```

---

## Conditional Headers with `when()`

```typescript
return res.builder
  .as.ok(user)
  .when(user.role === 'admin', b => b.setHeaders('X-Admin', 'true'))
  .when(isDebugMode, b => b.setHeaders('X-Debug-Trace', req.bar.ctx.request_id))
  .build();
```

---

## Headers Already Sent Guard

The Express dispatcher checks `res.headersSent` before dispatching. If headers were already sent (e.g., by streaming middleware), dispatch is skipped with a warning log:

```typescript
if (this.res.headersSent) {
  this.logger?.warn?.('BaR dispatch skipped: response headers already sent');
  return result;
}
```

Avoid calling `.build()` after manually writing to the response stream.

---

## Best Practices

| Concern | Recommendation |
|---|---|
| Auth cookies | Always `httpOnly: true`, `secure: true` in production |
| SameSite | Use `'strict'` for same-origin APIs, `'none'` only with `secure: true` |
| Rate limits | Expose remaining quota in `X-RateLimit-*` headers |
| Sensitive data | Never put tokens in response body if they're also in cookies |
| Cache | Override `Cache-Control` explicitly for static or CDN-cacheable GET routes |

> **WARNING:**
