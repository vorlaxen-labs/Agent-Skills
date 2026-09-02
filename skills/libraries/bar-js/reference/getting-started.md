# Getting Started

**BaR (Builder a Response)** streamlines your API response logic in minutes. This guide covers installation, adapter configuration, and your first standardized responses.

---

## Installation

```bash
pnpm add @vorlaxen-labs/bar-js
```

> **INFO:** Express is a peer dependency for the built-in adapter. Install separately if needed:
>
> ```bash
> pnpm add express
> pnpm add -D @types/express
> ```

---

## Basic Setup

Register the Express adapter as early middleware in your application bootstrap:

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
```

> **TIP:** Register `bar.handler()` **before** your route handlers. Every route registered after it gets `res.builder` and `req.bar.ctx`.
### What Gets Injected

| Property | Type | Description |
|---|---|---|
| `req.bar.ctx.request_id` | `string` | Trace/correlation ID |
| `req.bar.ctx.start_time` | `number` | Request start timestamp (ms) |
| `res.builder` | `ResponseBuilder` | Fluent response builder |

Express TypeScript types are included in the package — no manual `declare global` needed.

---

## Adapter Options

| Option | Type | Default | Description |
|---|---|---|---|
| `withDefaultHeaders` | `boolean` | enabled | Security headers on every response. Set `false` to disable. |
| `environment` | `'development' \| 'production' \| 'test'` | `undefined` | Production hides internal errors in `wrap()`. |
| `includeStack` | `boolean` | `undefined` | Include stack traces in dev error messages. |
| `logger` | `Logger` | `undefined` | Logger for adapter and builder events. |
| `hooks` | `BaRHooks` | `undefined` | Lifecycle hooks — see [Hooks System](reference/hooks.md). |
| `defaultHeaders` | `Record<string, string>` | `DEFAULT_SECURITY_HEADERS` | Custom default header set. |
| `requestIdHeaders` | `readonly string[]` | built-in | Headers to read existing request ID from. |

---

## Your First Responses

### Success

```typescript
app.get('/api/ping', (req, res) => {
  return res.builder
    .as.ok({ status: 'alive' }, 'Server is up and running!')
    .build();
});
```

### Created

```typescript
app.post('/api/users', async (req, res) => {
  const user = await userService.create(req.body);

  return res.builder
    .as.created({ id: user.id, name: user.name }, 'User created successfully')
    .build();
});
```

### Error

```typescript
app.post('/api/secure-data', (req, res) => {
  if (!req.headers.authorization) {
    return res.builder
      .as.unauthorized('Invalid or missing credentials.')
      .build();
  }

  return res.builder.as.ok({ secret: 'data' }).build();
});
```

### No Content

```typescript
app.delete('/api/items/:id', async (req, res) => {
  await itemService.delete(req.params.id);
  return res.builder.as.noContent().build();
});
```

---

## Context & Tracing

```typescript
app.get('/debug', (req, res) => {
  const { request_id, start_time } = req.bar.ctx;

  return res.builder
    .as.ok({
      traceId: request_id,
      elapsed_ms: Date.now() - start_time,
    })
    .build();
});
```

Every response includes `metadata.request_id` — see [Request Tracing](reference/request-tracing.md).

---

## Production Configuration

```typescript
import pino from 'pino';

const logger = pino({ level: 'info' });

const bar = new BarExpressAdapter({
  environment: 'production',
  logger,
});

app.use(bar.handler());
```

Combined with a global error filter — see [Error Handling](reference/error-handling.md).

---

## Middleware Order

Recommended Express middleware stack:

```
1. Trust proxy / IP resolver
2. CORS
3. Helmet (optional — BaR also sets security headers)
4. Compression
5. cookie-parser
6. bar.handler()          ← BaR injects builder + context
7. express.json()
8. Route handlers
9. Not found middleware
10. Global exception filter
```

---

## Next Steps

| Topic | Link |
|---|---|
| Response envelope fields | [Response Schema](reference/response-schema.md) |
| All `.as.*` methods | [Semantic Presets](reference/semantic-presets.md) |
| List endpoints | [Pagination](reference/pagination.md) |
| Async routes | [Advanced Chaining](reference/advanced-chaining.md) |
| Production patterns | [Recipes & Patterns](reference/recipes.md) |
| Full method listing | [API Reference](reference/api-reference.md) |
