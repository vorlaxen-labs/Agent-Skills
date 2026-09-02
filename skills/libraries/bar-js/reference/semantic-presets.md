# Semantic Presets

BaR's `.as` namespace provides semantic aliases for HTTP status codes. Instead of memorizing numbers, you express intent.

```typescript
res.builder.as.ok(data, message?);
res.builder.as.created(data, message?);
res.builder.as.notFound(message?);
```

Every preset returns the builder instance for further chaining.

---

## Success Presets (2xx)

### `.as.ok(data?, message?)`

| Property | Value |
|---|---|
| Status | `200` |
| `success` | `true` |
| Default message | `"Success"` |
| `data` | Provided value or `null` |

```typescript
res.builder.as.ok({ status: 'alive' }, 'Server is up').build();
res.builder.as.ok(users).build();
res.builder.as.ok().message('Pong').build();
```

---

### `.as.created(data?, message?)`

| Property | Value |
|---|---|
| Status | `201` |
| `success` | `true` |
| Default message | `"Resource created"` |

Use after POST operations that create a new resource:

```typescript
app.post('/api/users', async (req, res) => {
  const user = await userService.create(req.body);
  return res.builder.as.created({ id: user.id, email: user.email }, 'User created').build();
});
```

---

### `.as.accepted(message?)`

| Property | Value |
|---|---|
| Status | `202` |
| `success` | `true` |
| Default message | `"Request accepted"` |
| `data` | Not set (remains previous or `null`) |

Use for async operations queued for background processing:

```typescript
app.post('/api/reports/generate', async (req, res) => {
  const jobId = await reportQueue.enqueue(req.body);
  return res.builder
    .as.accepted('Report generation queued')
    .data({ jobId })
    .build();
});
```

---

### `.as.noContent()`

| Property | Value |
|---|---|
| Status | `204` |
| `success` | `true` |
| `data` | `null` |
| Message | `""` (empty) |
| Body | Not sent (RFC compliant) |

Use after successful DELETE or update operations with no return payload:

```typescript
app.delete('/api/sessions/:id', async (req, res) => {
  await sessionService.revoke(req.params.id);
  return res.builder.as.noContent().build();
});
```

---

## Client Error Presets (4xx)

All client error presets set `data: null` and `success: false`.

### `.as.badRequest(message?)`

| Status | Default Message |
|---|---|
| `400` | `"Bad Request"` |

Validation failures, malformed input:

```typescript
if (!email || !password) {
  return res.builder.as.badRequest('Email and password are required.').build();
}
```

---

### `.as.unauthorized(message?)`

| Status | Default Message |
|---|---|
| `401` | `"Unauthorized access"` |

Missing or invalid authentication:

```typescript
if (!req.headers.authorization) {
  return res.builder.as.unauthorized('Authentication token is required.').build();
}
```

---

### `.as.forbidden(message?)`

| Status | Default Message |
|---|---|
| `403` | `"Access forbidden"` |

Authenticated but insufficient permissions:

```typescript
if (req.user.role !== 'admin') {
  return res.builder.as.forbidden('Admin access required.').build();
}
```

---

### `.as.notFound(message?)`

| Status | Default Message |
|---|---|
| `404` | `"Resource not found"` |

```typescript
const user = await userService.findById(id);
if (!user) {
  return res.builder.as.notFound(`User ${id} not found.`).build();
}
```

---

### `.as.conflict(message?)`

| Status | Default Message |
|---|---|
| `409` | `"Conflict detected"` |

Duplicate resources, version conflicts:

```typescript
const existing = await userService.findByEmail(email);
if (existing) {
  return res.builder.as.conflict('An account with this email already exists.').build();
}
```

---

### `.as.unprocessable(message?)`

| Status | Default Message |
|---|---|
| `422` | `"Unprocessable entity"` |

Semantically invalid but syntactically correct input:

```typescript
if (endDate < startDate) {
  return res.builder.as.unprocessable('End date must be after start date.').build();
}
```

---

### `.as.tooManyRequests(message?)`

| Status | Default Message |
|---|---|
| `429` | `"Too many requests, please slow down"` |

Rate limiting:

```typescript
if (rateLimitExceeded(req.ip)) {
  return res.builder
    .as.tooManyRequests('Rate limit exceeded. Try again in 60 seconds.')
    .setHeaders('Retry-After', '60')
    .build();
}
```

---

## Server Error Presets (5xx)

### `.as.internalServerError(message?)`

| Status | Default Message |
|---|---|
| `500` | `"Internal server error"` |

Unexpected failures. Prefer letting a global error handler catch these rather than calling directly in routes.

---

### `.as.serviceUnavailable(message?)`

| Status | Default Message |
|---|---|
| `503` | `"Service temporarily unavailable"` |

Maintenance mode, dependency down:

```typescript
if (!database.isConnected()) {
  return res.builder.as.serviceUnavailable('Database is temporarily unavailable.').build();
}
```

---

### `.as.gatewayTimeout(message?)`

| Status | Default Message |
|---|---|
| `504` | `"Gateway timeout"` |

Upstream service timeout:

```typescript
if (upstreamTimedOut) {
  return res.builder.as.gatewayTimeout('Payment provider did not respond in time.').build();
}
```

---

## Complete Reference Table

| Method | Status | `success` | Default Message |
|---|---|---|---|
| `.as.ok()` | 200 | `true` | `"Success"` |
| `.as.created()` | 201 | `true` | `"Resource created"` |
| `.as.accepted()` | 202 | `true` | `"Request accepted"` |
| `.as.noContent()` | 204 | `true` | `""` |
| `.as.badRequest()` | 400 | `false` | `"Bad Request"` |
| `.as.unauthorized()` | 401 | `false` | `"Unauthorized access"` |
| `.as.forbidden()` | 403 | `false` | `"Access forbidden"` |
| `.as.notFound()` | 404 | `false` | `"Resource not found"` |
| `.as.conflict()` | 409 | `false` | `"Conflict detected"` |
| `.as.unprocessable()` | 422 | `false` | `"Unprocessable entity"` |
| `.as.tooManyRequests()` | 429 | `false` | `"Too many requests, please slow down"` |
| `.as.internalServerError()` | 500 | `false` | `"Internal server error"` |
| `.as.serviceUnavailable()` | 503 | `false` | `"Service temporarily unavailable"` |
| `.as.gatewayTimeout()` | 504 | `false` | `"Gateway timeout"` |

---

## StatusCodes Constant

BaR exports a typed constant map for programmatic access:

```typescript
import { StatusCodes } from '@vorlaxen-labs/bar-js';

StatusCodes.SUCCESSFUL.OK;           // 200
StatusCodes.SUCCESSFUL.CREATED;      // 201
StatusCodes.CLIENT_ERROR.NOT_FOUND;  // 404
StatusCodes.CLIENT_ERROR.CONFLICT;   // 409
StatusCodes.SERVER_ERROR.INTERNAL_SERVER_ERROR; // 500
```

Use when you need status codes outside the builder (logging, metrics, custom middleware):

```typescript
if (res.statusCode === StatusCodes.CLIENT_ERROR.UNAUTHORIZED) {
  auditLog.record('auth_failure', req.bar.ctx.request_id);
}
```

---

## Chaining After Presets

Presets initialize status, data, message, and success. You can continue chaining:

```typescript
return res.builder
  .as.ok(users, 'Users retrieved')
  .paginate(total, page, limit)
  .setHeaders('X-Total-Count', String(total))
  .setMeta({ source: 'read-replica' })
  .build();
```

```typescript
return res.builder
  .as.unauthorized('Token expired')
  .setHeaders('WWW-Authenticate', 'Bearer realm="api"')
  .build();
```

---

## Choosing the Right Preset

| Situation | Preset |
|---|---|
| GET returns data | `.as.ok(data)` |
| POST creates resource | `.as.created(data, message)` |
| DELETE succeeds, no body | `.as.noContent()` |
| Background job queued | `.as.accepted(message)` |
| Missing auth token | `.as.unauthorized()` |
| Valid token, wrong role | `.as.forbidden()` |
| Resource doesn't exist | `.as.notFound()` |
| Duplicate email on signup | `.as.conflict()` |
| Valid JSON, invalid business rule | `.as.unprocessable()` |
| Rate limit hit | `.as.tooManyRequests()` |
| Database connection lost | `.as.serviceUnavailable()` |

> **TIP:**
