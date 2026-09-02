---
name: bar-js
description: >-
  Framework-agnostic TypeScript API response builder (@vorlaxen-labs/bar-js).
  Standardizes JSON envelopes with semantic presets, request tracing, pagination,
  cookies, hooks, and security headers. Use when building REST API responses,
  Express middleware, res.builder patterns, or consistent error/success shapes.
---
# BaR (Builder a Response)

**Package:** `@vorlaxen-labs/bar-js` v2.0.0 · **Zero runtime deps**

Framework-agnostic response builder that replaces ad-hoc `res.status().json()` with a fluent, typed API enforcing a single response contract.

---

## Critical Rules

1. **Register `bar.handler()` before route handlers** — injects `res.builder` and `req.bar.ctx`.
2. **Always call `.build()`** to dispatch — chaining alone does not send a response.
3. **Use semantic presets** (`.as.ok()`, `.as.created()`, etc.) instead of raw status codes.
4. **Use `.wrap(promise)`** for async routes — then call `.build()` or `.message()`. Do **not** call `.as.ok(undefined)` after `wrap()` — it overwrites resolved data with `null`.
5. **Set `environment: 'production'`** in prod — masks internal error details in `wrap()`.
6. **Never invent response fields** — follow the envelope schema below.

---

## Response Envelope

Every response follows this shape:

```typescript
interface IResponse<T = unknown, M = unknown> {
  success: boolean;
  timestamp: string;       // ISO 8601 at build time
  message?: string;
  data: T | null;
  metadata: {
    request_id: string;
    server_time: string;
    status_code: number;
  } & M;
}
```

- `success` is `true` for status `200–399` (unless `.forceSuccess()` overrides).
- `metadata.request_id` is auto-generated or read from `X-Request-Id` / `X-Correlation-Id` / `traceparent`.

---

## Quick Start

```typescript
import express from 'express';
import { BarExpressAdapter } from '@vorlaxen-labs/bar-js';

const app = express();
const bar = new BarExpressAdapter({
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  logger: console,
});

app.use(bar.handler());
app.use(express.json());

app.get('/api/users/:id', async (req, res) => {
  await res.builder.wrap(userService.findById(req.params.id));
  return res.builder.message('User retrieved').build();
});
```

---

## Semantic Presets (`.as.*`)

| Method | Status | Default Message |
|---|---|---|
| `ok(data?, message?)` | 200 | `"Success"` |
| `created(data?, message?)` | 201 | `"Resource created"` |
| `accepted(message?)` | 202 | `"Request accepted"` |
| `noContent()` | 204 | `""` |
| `badRequest(message?)` | 400 | `"Bad Request"` |
| `unauthorized(message?)` | 401 | `"Unauthorized access"` |
| `forbidden(message?)` | 403 | `"Access forbidden"` |
| `notFound(message?)` | 404 | `"Resource not found"` |
| `conflict(message?)` | 409 | `"Conflict detected"` |
| `unprocessable(message?)` | 422 | `"Unprocessable entity"` |
| `tooManyRequests(message?)` | 429 | `"Too many requests, please slow down"` |
| `internalServerError(message?)` | 500 | `"Internal server error"` |
| `serviceUnavailable(message?)` | 503 | `"Service temporarily unavailable"` |
| `gatewayTimeout(message?)` | 504 | `"Gateway timeout"` |

---

## Common Patterns

### Async with wrap

```typescript
app.post('/api/users', async (req, res) => {
  await res.builder.wrap(userService.create(req.body));
  return res.builder.message('User created').status(201).build();
});
```

### Pagination

```typescript
return res.builder
  .as.ok(users)
  .paginate(total, page, limit)
  .build();
```

### Conditional chaining

```typescript
return res.builder
  .as.ok(data)
  .when(includeMeta, b => b.setMeta({ version: '2.0' }))
  .build();
```

### Request tracing

```typescript
const { request_id, start_time } = req.bar.ctx;
// request_id appears in every response metadata
```

---

## Middleware Order

```
1. Trust proxy / CORS
2. bar.handler()          ← injects builder + context
3. express.json()
4. Route handlers
5. Not found middleware
6. Global exception filter
```

---

## Adapter Options

| Option | Default | Description |
|---|---|---|
| `withDefaultHeaders` | enabled | Security headers on every response |
| `environment` | `undefined` | `'production'` hides internal errors in `wrap()` |
| `includeStack` | `undefined` | Stack traces in dev error messages |
| `logger` | `undefined` | Logger for adapter and builder events |
| `hooks` | `undefined` | Lifecycle hooks (`before_build`, `after_build`, etc.) |

---

## When NOT to Use BaR

- GraphQL or gRPC exclusively
- Streaming/SSE responses (BaR is JSON-focused)
- API already has a mature, enforced response envelope that cannot change

---

## Reference Documentation

| Topic | File |
|---|---|
| Installation & setup | [reference/getting-started.md](reference/getting-started.md) |
| Full method listing | [reference/api-reference.md](reference/api-reference.md) |
| Envelope field details | [reference/response-schema.md](reference/response-schema.md) |
| All `.as.*` presets | [reference/semantic-presets.md](reference/semantic-presets.md) |
| `wrap()`, `transform()`, `when()` | [reference/advanced-chaining.md](reference/advanced-chaining.md) |
| List endpoints | [reference/pagination.md](reference/pagination.md) |
| Request ID & correlation | [reference/request-tracing.md](reference/request-tracing.md) |
| Error handling & masking | [reference/error-handling.md](reference/error-handling.md) |
| Cookies & headers | [reference/cookies-headers.md](reference/cookies-headers.md) |
| Lifecycle hooks | [reference/hooks.md](reference/hooks.md) |
| Security headers | [reference/security.md](reference/security.md) |
| Fastify / custom adapters | [reference/adapters.md](reference/adapters.md) |
| Production patterns | [reference/recipes.md](reference/recipes.md) |
| TypeScript generics | [reference/typescript.md](reference/typescript.md) |
