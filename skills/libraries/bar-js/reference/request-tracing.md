# Request Tracing

Every BaR response includes a `metadata.request_id` — a unique identifier that ties client-side errors to server-side logs. This page covers how IDs are generated, propagated, and used in production.

---

## Request Context

BaR injects a context object on every Express request:

```typescript
interface BaRContext {
  request_id: string;
  start_time: number;
}

req.bar.ctx.request_id;
req.bar.ctx.start_time;
```

Access it anywhere in your middleware stack after `bar.handler()` is registered.

---

## How `request_id` Is Resolved

BaR follows a priority chain when assigning a request ID:

```
1. X-Request-Id header        (if valid UUID or non-empty string)
2. X-Correlation-Id header    (if valid UUID or non-empty string)
3. traceparent header         (W3C Trace Context — extracts trace ID)
4. Generated UUID v4          (fallback)
```

### Incoming Header Support

| Header | Behavior |
|---|---|
| `X-Request-Id` | Used as-is if non-empty; UUID format preferred |
| `X-Correlation-Id` | Same as above |
| `traceparent` | Parses W3C format `00-{trace-id}-{span-id}-{flags}` and converts trace ID to UUID format |

### Custom Header Names

Configure additional headers via adapter options:

```typescript
const bar = new BarExpressAdapter({
  requestIdHeaders: [
    'x-request-id',
    'x-correlation-id',
    'x-amzn-trace-id',
    'traceparent',
  ],
});
```

---

## Propagating Trace IDs from Clients

Front-end clients should send a correlation header on every request:

```typescript
const requestId = crypto.randomUUID();

await fetch('/api/users', {
  headers: {
    'X-Request-Id': requestId,
    'Authorization': `Bearer ${token}`,
  },
});
```

When the client receives an error, display `metadata.request_id` to the user:

```typescript
catch (error) {
  if (error instanceof ApiError) {
    showToast(`Something went wrong. Reference: ${error.requestId}`);
  }
}
```

Support teams can then grep server logs for that exact ID.

---

## Logging with Trace Context

### Basic Request Logging

```typescript
app.use((req, res, next) => {
  const start = req.bar.ctx.start_time;

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(JSON.stringify({
      request_id: req.bar.ctx.request_id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration_ms: duration,
    }));
  });

  next();
});
```

### Structured Logger Integration

```typescript
import pino from 'pino';

const logger = pino();

app.use((req, res, next) => {
  req.log = logger.child({ request_id: req.bar.ctx.request_id });
  next();
});

app.get('/api/users/:id', async (req, res) => {
  req.log.info({ userId: req.params.id }, 'Fetching user');
  const user = await userService.findById(req.params.id);
  return res.builder.as.ok(user).build();
});
```

---

## BaRContextFactory

Create context manually for non-Express environments:

```typescript
import { BaRContextFactory } from '@vorlaxen-labs/bar-js';

const ctx = BaRContextFactory.create(req, {
  requestIdHeaders: ['x-request-id', 'x-correlation-id'],
});

const builder = new ResponseBuilder(dispatcher, options, ctx);
```

---

## Including Trace ID in Error Responses

BaR automatically includes `request_id` in every response's metadata. No extra configuration needed:

```json
{
  "success": false,
  "message": "Resource not found",
  "data": null,
  "metadata": {
    "status_code": 404,
    "request_id": "fddc7272-4405-4001-9858-ab40007bfa11",
    "server_time": "2026-06-19T14:32:01.234Z"
  }
}
```

For custom error middleware, read the ID from context:

```typescript
app.use((err, req, res, next) => {
  const requestId = req.bar?.ctx?.request_id ?? 'unknown';

  logger.error({ err, requestId }, 'Unhandled exception');

  return res.builder
    .as.internalServerError(AppConfig.isProd ? 'Internal Server Error' : err.message)
    .setMeta({ error_code: 'UNEXPECTED_ERROR' })
    .build();
});
```

---

## Measuring Request Duration

Use `start_time` for latency tracking:

```typescript
app.get('/api/heavy', async (req, res) => {
  const result = await heavyOperation();

  return res.builder
    .as.ok(result)
    .setMeta({
      duration_ms: Date.now() - req.bar.ctx.start_time,
    })
    .build();
});
```

Or attach duration in a response hook — see [Hooks System](reference/hooks.md).

---

## Distributed Tracing Integration

When running behind a load balancer or API gateway that sets trace headers, BaR picks them up automatically:

```
Client → API Gateway (sets X-Request-Id) → Your App (BaR reuses ID) → Response
```

For OpenTelemetry integration, use the same `request_id` as your span attribute:

```typescript
import { trace } from '@opentelemetry/api';

app.use((req, res, next) => {
  const span = trace.getActiveSpan();
  span?.setAttribute('request_id', req.bar.ctx.request_id);
  next();
});
```

---

## Best Practices

1. **Always register BaR before route handlers** — otherwise `req.bar` is undefined
2. **Log `request_id` on every error** — makes production debugging tractable
3. **Return `request_id` to clients on errors** — it's already in metadata, document this in your API
4. **Accept incoming correlation headers** — don't regenerate IDs when upstream already provides them
5. **Use child loggers bound to `request_id`** — keeps log aggregation clean in ELK/Datadog/CloudWatch

> **WARNING:**
