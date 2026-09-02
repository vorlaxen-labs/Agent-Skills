# BaR (Builder a Response)

**Design your API responses like a pro, serve them like a bartender.**

`@vorlaxen-labs/bar-js` is a framework-agnostic TypeScript response builder that standardizes every API response into a predictable, traceable, and secure schema. It replaces ad-hoc `res.status().json()` calls with a fluent, composable API.

---

## The Problem BaR Solves

Most backend teams eventually hit the same wall:

- Every endpoint returns JSON in a slightly different shape
- Error responses are inconsistent — sometimes `{ error: "..." }`, sometimes `{ message: "..." }`
- No request correlation between client errors and server logs
- Security headers are forgotten or applied inconsistently
- Pagination metadata is reinvented on every list endpoint

BaR eliminates this by enforcing a **single response contract** across your entire API surface.

---

## Features

- **Framework Agnostic Core:** Built-in Express adapter; use `ResponseBuilder` + `IBaRDispatcher` for Fastify, Hono, or vanilla Node.js.
- **Fluent Interface:** Chain `.as.ok()`, `.setHeaders()`, `.paginate()`, `.setCookies()` before a single `.build()`.
- **14 Semantic Presets:** `.as.ok()`, `.as.created()`, `.as.unauthorized()`, `.as.tooManyRequests()`, and more.
- **Built-in Tracing:** Every request gets a `request_id`; supports `X-Request-Id`, `X-Correlation-Id`, and W3C `traceparent`.
- **Security by Default:** API-safe security headers injected automatically unless explicitly disabled.
- **Lifecycle Hooks:** `before_build`, `after_build`, `before_dispatch`, `after_dispatch`, `error`.
- **Environment-Aware Errors:** Production mode hides internal error details from clients when using `wrap()`.
- **Fully Type-Safe:** Generic `ResponseBuilder<T, M>` with exported types for metadata, cookies, and final results.
- **Zero Runtime Dependencies:** Pure TypeScript — only Express types as a peer for the adapter.

---

## Quick Example

```typescript
import express from 'express';
import { BarExpressAdapter } from '@vorlaxen-labs/bar-js';

const app = express();
const bar = new BarExpressAdapter({ environment: 'production' });

app.use(bar.handler());

app.get('/api/users/:id', async (req, res) => {
  await res.builder.wrap(userService.findById(req.params.id));

  return res.builder
    .message('User retrieved')
    .setHeaders('X-Cache', 'MISS')
    .build();
});
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-06-19T12:00:00.000Z",
  "message": "User retrieved",
  "data": { "id": "abc", "name": "Hakan" },
  "metadata": {
    "status_code": 200,
    "request_id": "fddc7272-4405-4001-9858-ab40007bfa11",
    "server_time": "2026-06-19T12:00:00.000Z"
  }
}
```

---

## Documentation Map

| Section | What you'll learn |
|---|---|
| [Getting Started](reference/getting-started.md) | Installation, adapter setup, first response |
| [Response Schema](reference/response-schema.md) | Every field, metadata rules, success derivation |
| [Semantic Presets](reference/semantic-presets.md) | All `.as.*` methods with defaults and examples |
| [Request Tracing](reference/request-tracing.md) | `request_id`, correlation headers, logging |
| [Advanced Chaining](reference/advanced-chaining.md) | `wrap()`, `transform()`, `when()`, `forceSuccess()` |
| [Pagination](reference/pagination.md) | List endpoints, metadata shape, helper patterns |
| [Cookies & Headers](reference/cookies-headers.md) | Security cookies, rate-limit headers, CORS |
| [Hooks System](reference/hooks.md) | Lifecycle events, auditing, immutability |
| [Error Handling](reference/error-handling.md) | Global filters, `wrap()`, production masking |
| [Security](reference/security.md) | Default headers, CSP, cache control |
| [Adapters](reference/adapters.md) | Express, Fastify, custom dispatchers |
| [TypeScript Guide](reference/typescript.md) | Generics, custom metadata types, exports |
| [Recipes & Patterns](reference/recipes.md) | Auth, CRUD, health checks, admin dashboards |
| [API Reference](reference/api-reference.md) | Complete method and export listing |

---

## When to Use BaR

BaR is the right choice when:

- You maintain a REST API consumed by web or mobile clients
- You need consistent error shapes across dozens of endpoints
- You want request tracing without adding OpenTelemetry on day one
- Your team agrees on a single response contract

BaR is **not** the right choice when:

- You expose GraphQL or gRPC exclusively
- You need streaming/SSE responses (BaR is JSON-focused)
- Your API already has a mature, enforced response envelope you cannot change

---

## License

Distributed under the MIT License.

> **INFO:**
