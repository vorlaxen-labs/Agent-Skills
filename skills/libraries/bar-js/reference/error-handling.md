# Error Handling

BaR provides multiple layers for handling errors consistently — from async route failures to global exception filters.

---

## Error Response Shape

All BaR error responses follow the standard envelope:

```json
{
  "success": false,
  "timestamp": "2026-06-19T14:32:01.234Z",
  "message": "Resource not found",
  "data": null,
  "metadata": {
    "status_code": 404,
    "request_id": "fddc7272-4405-4001-9858-ab40007bfa11",
    "server_time": "2026-06-19T14:32:01.234Z"
  }
}
```

`data` is always `null` on errors. Never put error details in `data`.

---

## Layer 1: Explicit Presets in Routes

Handle expected failures directly in route handlers:

```typescript
app.get('/api/users/:id', async (req, res) => {
  const user = await userService.findById(req.params.id);

  if (!user) {
    return res.builder.as.notFound(`User ${req.params.id} not found.`).build();
  }

  return res.builder.as.ok(user).build();
});
```

Use the appropriate preset for each failure type — see [Semantic Presets](reference/semantic-presets.md).

---

## Layer 2: `wrap()` for Async Failures

`wrap()` catches rejected promises and converts them to 500 responses:

```typescript
app.get('/api/users/:id', async (req, res) => {
  const builder = res.builder;
  await builder.wrap(userService.findById(req.params.id));
  return builder.build();
});
```

### Success Path

Promise resolves → resolved value becomes `data`, status defaults to `200`.

### Error Path

Promise rejects → BaR sets:

| Field | Value |
|---|---|
| Status | `500` |
| `success` | `false` |
| `data` | `null` |
| `message` | Error message (or generic in production) |

### Production Error Masking

When adapter is configured with `environment: 'production'`:

```typescript
const bar = new BarExpressAdapter({ environment: 'production' });
```

Clients see the full envelope with a masked message:
```json
{
  "success": false,
  "timestamp": "2026-06-19T14:32:01.234Z",
  "message": "Internal Server Error",
  "data": null,
  "metadata": {
    "status_code": 500,
    "request_id": "fddc7272-4405-4001-9858-ab40007bfa11",
    "server_time": "2026-06-19T14:32:01.234Z"
  }
}
```

Developers still get the full error via the `error` hook:

```typescript
hooks.on('error', ({ error, message, statusCode }) => {
  logger.error({ err: error, statusCode }, message);
});
```

### Development with Stack Traces

```typescript
const bar = new BarExpressAdapter({
  environment: 'development',
  includeStack: true,
});
```

Clients see the full error stack in the message field.

---

## Layer 3: Global Exception Filter

For unexpected errors thrown in route handlers, use Express error middleware with BaR:

```typescript
import { APIError } from './errors';

class NotFoundError extends APIError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
  }
}

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);

  const isAppError = err instanceof APIError;
  const status = isAppError ? err.httpStatus : 500;

  logger.error({
    err,
    request_id: req.bar?.ctx?.request_id,
    path: req.originalUrl,
  });

  const builder = res.builder;

  if (status === 404) return builder.as.notFound(err.message).build();
  if (status === 401) return builder.as.unauthorized(err.message).build();
  if (status === 403) return builder.as.forbidden(err.message).build();
  if (status === 409) return builder.as.conflict(err.message).build();
  if (status === 422) return builder.as.unprocessable(err.message).build();

  return builder
    .as.internalServerError(
      process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message
    )
    .setMeta({ error_code: isAppError ? err.code : 'UNEXPECTED_ERROR' })
    .build();
});
```

Register **after** all routes:

```typescript
app.use(notFoundHandler);
app.use(globalExceptionFilter);
```

---

## Layer 4: Not Found Middleware

Convert unmatched routes into structured 404 errors:

```typescript
app.use((req, res, next) => {
  next(new NotFoundError(`${req.method} ${req.originalUrl} not found.`));
});
```

The global filter catches this and returns a BaR-formatted 404.

---

## Custom Error Classes

Define domain errors that map to BaR presets:

```typescript
abstract class AppError extends Error {
  abstract readonly httpStatus: number;
  abstract readonly code: string;
}

class ValidationError extends AppError {
  readonly httpStatus = 422;
  readonly code = 'VALIDATION_ERROR';
  constructor(message: string, readonly fields?: Record<string, string>) {
    super(message);
  }
}

class UnauthorizedError extends AppError {
  readonly httpStatus = 401;
  readonly code = 'UNAUTHORIZED';
}
```

In the global filter:

```typescript
if (err instanceof ValidationError) {
  return res.builder
    .as.unprocessable(err.message)
    .setMeta({ fields: err.fields })
    .build();
}
```

---

## Error Handling Decision Tree

```
Is this an expected failure?
├── Yes → Use .as.* preset directly in route
│
Is the failure from an async operation?
├── Yes → Use wrap(), then .build() or .message() — do not call .as.ok(undefined) after wrap()
│
Is this an thrown exception?
├── Yes → throw AppError, let global filter handle it
│
Is the route unmatched?
└── Yes → Not found middleware → global filter
```

---

## `wrap()` vs try/catch

### Prefer `wrap()`

```typescript
app.get('/api/data', async (req, res) => {
  const builder = res.builder;
  await builder.wrap(dataService.fetch());
  return builder.build();
});
```

### Use try/catch when you need branch logic

```typescript
app.post('/api/transfer', async (req, res) => {
  try {
    const result = await transferService.execute(req.body);
    return res.builder.as.ok(result, 'Transfer completed').build();
  } catch (err) {
    if (err instanceof InsufficientFundsError) {
      return res.builder.as.unprocessable(err.message).build();
    }
    throw err;
  }
});
```

---

## Adding Error Context with `setMeta()`

Attach machine-readable error codes for clients:

```typescript
return res.builder
  .as.conflict('Email already registered')
  .setMeta({ error_code: 'EMAIL_TAKEN', field: 'email' })
  .build();
```

```json
{
  "success": false,
  "message": "Email already registered",
  "data": null,
  "metadata": {
    "status_code": 409,
    "request_id": "...",
    "error_code": "EMAIL_TAKEN",
    "field": "email"
  }
}
```

---

## Best Practices

1. **Never expose stack traces in production** — use `environment: 'production'`
2. **Always include `request_id` in error logs** — BaR provides it via `req.bar.ctx`
3. **Use typed error classes** — map them to presets in one global filter
4. **Keep route handlers thin** — expected errors inline, unexpected errors thrown
5. **Don't mix response formats** — if BaR is your standard, use it in the error filter too

> **WARNING:**
