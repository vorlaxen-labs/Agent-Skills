# Hooks System

BaR's hook system lets you inject cross-cutting concerns into the response lifecycle — logging, auditing, metrics, and validation — without polluting route handlers.

---

## Hook Events

| Event | Fires | Payload |
|---|---|---|
| `before_build` | Before response body is assembled | `{ statusCode }` |
| `after_build` | After assembly, before dispatch | Full `BaRFinalResult` (cloned) |
| `before_dispatch` | Before adapter sends response | Full `BaRFinalResult` (cloned) |
| `after_dispatch` | After adapter sends response | Full `BaRFinalResult` (cloned) |
| `error` | When a hook throws, or `wrap()` catches an error | Error details |

### Execution Order

```
before_build
  → assemble body + metadata
after_build
  → before_dispatch
    → dispatcher.dispatch()
  → after_dispatch
```

---

## Setup

```typescript
import { BaRHooks, BarExpressAdapter } from '@vorlaxen-labs/bar-js';

const hooks = new BaRHooks(console);

hooks.on('before_build', (payload) => {
  console.log('Building response with status:', payload.statusCode);
});

hooks.on('after_build', (result) => {
  console.log('Built:', result.body.success, result.statusCode);
});

hooks.on('after_dispatch', (result) => {
  metrics.record('api.response', {
    status: result.statusCode,
    success: result.body.success,
  });
});

const bar = new BarExpressAdapter({ hooks, logger: console });
app.use(bar.handler());
```

---

## BaRHooks API

```typescript
class BaRHooks {
  constructor(logger?: Logger);

  on(event: BaRHookEvent, fn: HookFn): void;
  hasListeners(event: BaRHookEvent): boolean;
  emit(event: BaRHookEvent, payload: unknown): void;
}

type BaRHookEvent =
  | 'before_build'
  | 'after_build'
  | 'before_dispatch'
  | 'after_dispatch'
  | 'error';

type HookFn = (payload: unknown) => void;
```

---

## Immutability Guarantee

`after_build`, `before_dispatch`, and `after_dispatch` receive a **structurally cloned** copy of the payload via `structuredClone()`. Mutating the hook payload does not affect the actual response:

```typescript
hooks.on('after_build', (result) => {
  result.body.success = false;
  result.body.message = 'Hacked';
});

const res = builder.as.ok({ data: true }).build();
```

The client still receives `success: true`.

---

## Hook Error Handling

If a hook throws, BaR:

1. Logs a warning via the hook logger
2. Emits an `error` event with `{ sourceEvent, error, payload }`
3. Continues executing remaining hooks (does not abort the response)

```typescript
hooks.on('after_build', () => {
  throw new Error('Audit service down');
});

hooks.on('error', ({ sourceEvent, error }) => {
  console.error(`Hook "${sourceEvent}" failed:`, error.message);
});
```

The response still dispatches normally — hook failures never block API responses.

---

## Use Cases

### Response Audit Log

```typescript
hooks.on('after_dispatch', (result) => {
  auditLog.write({
    status: result.statusCode,
    success: result.body.success,
    request_id: result.body.metadata.request_id,
    timestamp: result.body.timestamp,
  });
});
```

### Slow Response Warning

```typescript
app.use((req, res, next) => {
  req._barStart = Date.now();
  next();
});

hooks.on('after_dispatch', (result) => {
  const duration = Date.now() - req._barStart;
  if (duration > 1000) {
    logger.warn({
      request_id: result.body.metadata.request_id,
      duration_ms: duration,
      path: req.originalUrl,
    }, 'Slow response');
  }
});
```

### Response Size Metrics

```typescript
hooks.on('after_build', (result) => {
  const size = JSON.stringify(result.body).length;
  metrics.histogram('response.body.size', size, {
    status: result.statusCode,
  });
});
```

### PII Masking in Logs

```typescript
hooks.on('after_build', (result) => {
  const safe = structuredClone(result.body);
  if (safe.data?.password) safe.data.password = '[REDACTED]';
  logger.debug({ response: safe }, 'Response built');
});
```

---

## `wrap()` Error Hook

When `wrap()` catches a rejected promise, it emits the `error` hook:

```typescript
hooks.on('error', ({ error, message, statusCode }) => {
  errorTracker.capture(error, { message, statusCode });
});

app.get('/api/users/:id', async (req, res) => {
  const builder = res.builder;
  await builder.wrap(userService.findById(req.params.id));
  return builder.build();
});
```

In production (`environment: 'production'`), the client sees `"Internal Server Error"` — the hook receives the full error object for logging.

---

## Standalone Builder with Hooks

Hooks work on manually constructed builders too:

```typescript
import { ResponseBuilder, BaRHooks } from '@vorlaxen-labs/bar-js';

const hooks = new BaRHooks();
hooks.on('before_build', (p) => console.log(p));

const builder = new ResponseBuilder(undefined, { hooks });
const result = builder.as.ok({ test: true }).build();
```

Without a dispatcher, `.build()` returns the `BaRFinalResult` object instead of dispatching.

---

## Multiple Listeners

Multiple functions can listen to the same event — they execute in registration order:

```typescript
hooks.on('after_dispatch', logResponse);
hooks.on('after_dispatch', recordMetrics);
hooks.on('after_dispatch', notifyWebhook);
```

---

## Best Practices

1. **Keep hooks fast** — they run on the critical response path
2. **Never throw intentionally** — use the `error` event for failure handling
3. **Use `after_dispatch` for side effects** — logging, metrics, webhooks
4. **Use `before_build` for last-minute validation** — rare, but useful for compliance checks
5. **Don't mutate payloads** — rely on the immutability guarantee; clone if you need to inspect

> **TIP:**
