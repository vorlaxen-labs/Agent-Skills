# Advanced Chaining

BaR is not just about standardizing responses — it gives you **fine-grained control over how responses are built and delivered**.

In this section, you'll learn:

* How to override status codes and the `success` flag
* How to manage response headers and cookies
* How to use `wrap()` for async/Promise data
* How to transform data inline with `transform()`
* How to write conditional builder logic with `when()`
* How to add pagination metadata with `paginate()`
* How to attach custom metadata with `setMeta()` and `withMetadata()`
* How to use lifecycle hooks

---

## Chaining Fundamentals

BaR uses a fluent interface. Every method returns the same builder instance:

```typescript
res.builder
  .as.ok(data)
  .setHeaders('X-Custom', 'value')
  .build();
```

This allows you to compose responses step by step, keeping your logic readable and intention-driven.

---

## Custom Status Codes

Built-in `.as.*` presets cover the most common cases. When you need something different, you can override the status code manually.

### Using `.status()`

```typescript
return res.builder
  .as.ok({ data: 'test' })
  .status(202)
  .build();
```

`.as.ok()` initializes the response schema, then `.status(202)` overrides the HTTP status code.

### Manual Build (no preset)

```typescript
return res.builder
  .status(200)
  .message('Custom message')
  .data({ custom: true })
  .build();
```

You can also build a response entirely without a preset using `.status()`, `.message()`, and `.data()` directly.

---

## Overriding the `success` Flag

By default, `success` is derived automatically from the status code:

* `2xx` → `success: true`
* `4xx` / `5xx` → `success: false`

Use `forceSuccess()` to override this behavior when needed:

```typescript
return res.builder
  .status(200)
  .forceSuccess(false)
  .message('Validation passed but no action taken')
  .data(null)
  .build();
```

---

## Custom Headers

Attach headers to your response with `setHeaders()` or the `header()` alias:

```typescript
return res.builder
  .as.ok({ success: true })
  .setHeaders('X-RateLimit-Remaining', '42')
  .header('X-App-Version', '1.3.0')
  .build();
```

### Setting Multiple Headers at Once

```typescript
return res.builder
  .as.ok(data)
  .setHeaders({
    'X-Service': 'auth',
    'X-Env': 'production'
  })
  .build();
```

---

## Cookie Management

Use `setCookies()` to attach cookies to your response:

### Single Cookie

```typescript
return res.builder
  .as.ok({ loggedIn: true })
  .setCookies('session', 'abc123', { httpOnly: true, secure: true, sameSite: 'lax' })
  .build();
```

### Multiple Cookies (Object Shorthand)

```typescript
return res.builder
  .as.ok(data)
  .setCookies({ theme: 'dark', lang: 'en' })
  .build();
```

Supported cookie options: `httpOnly`, `secure`, `sameSite`, `path`, `domain`, `maxAge`, `expires`.

---

## Custom Metadata

Use `setMeta()` to attach additional fields to the `metadata` object:

```typescript
return res.builder
  .status(200)
  .message('Meta test')
  .data({ ok: true })
  .setMeta({ custom_field: 'custom_value', version: '1.0.0' })
  .build();
```

Use `withMetadata()` to merge auto-generated metadata via `MetadataFactory`:

```typescript
return res.builder
  .as.ok(data)
  .withMetadata({ cluster: 'eu-west-1' })
  .build();
```

> **WARNING:** `withMetadata()` generates a new `request_id` internally. At build time it can override `req.bar.ctx.request_id` in the response metadata. Prefer `setMeta()` for custom fields when request correlation must stay intact.

---

## Pagination

Use `paginate()` to automatically compute and inject pagination metadata:

```typescript
return res.builder
  .as.ok(users)
  .paginate(100, 2, 20)
  .build();
```

**Metadata result:**
```json
{
  "metadata": {
    "status_code": 200,
    "request_id": "...",
    "server_time": "...",
    "pagination": {
      "total": 100,
      "page": 2,
      "limit": 20,
      "total_pages": 5,
      "has_next": true
    }
  }
}
```

---

## Async Support with `wrap()`

`wrap()` accepts a Promise and handles both the success and error paths for you.

### Success Path

```typescript
const builder = res.builder;
await builder.wrap(userService.findById(id));
return builder.build();
```

### Error Path

```typescript
await builder.wrap(Promise.reject(new Error('DB Error')));
return builder.build();
```

If the Promise rejects, BaR automatically sets status `500`, `success: false`, and `message` to the error message. In `production` environment, internal error details are not exposed to clients.

---

## Data Transformation with `transform()`

`transform()` lets you modify the response data inline. Multiple calls chain sequentially:

```typescript
return res.builder
  .data(10)
  .transform(n => n * 2)
  .transform(n => `Value: ${n}`)
  .build();
```

Skipped when `data` is `null`.

---

## Conditional Logic with `when()`

```typescript
return res.builder
  .as.ok(user)
  .when(isAdmin, b => b.setHeaders('X-Admin', 'true'))
  .when(isPaginated, b => b.paginate(total, page, limit))
  .build();
```

---

## Lifecycle Hooks

BaR supports hooks via the `BaRHooks` class:

| Event | When it fires |
|---|---|
| `before_build` | Before the response body is assembled |
| `after_build` | After assembly, before dispatch |
| `before_dispatch` | Before the adapter sends the response |
| `after_dispatch` | After the adapter sends the response |
| `error` | When a hook throws or `wrap()` rejects |

### Setup

```typescript
import { BaRHooks, BarExpressAdapter } from '@vorlaxen-labs/bar-js';

const hooks = new BaRHooks(console);

hooks.on('before_build', (payload) => {
  console.log('About to build:', payload);
});

const bar = new BarExpressAdapter({ hooks, logger: console });
```

The `after_build` hook receives a **structurally cloned** copy of the payload. Mutating it does not affect the actual response.

### Hook Order on `.build()`

```
before_build → assemble → after_build → before_dispatch → dispatch → after_dispatch
```

---

## Real-World Example

```typescript
app.post('/api/login', async (req, res) => {
  const user = await authService.login(req.body);

  if (!user) {
    return res.builder
      .as.unauthorized('Invalid credentials')
      .setHeaders('X-Auth-Reason', 'INVALID_CREDENTIALS')
      .build();
  }

  return res.builder
    .as.ok({ user }, 'Login successful')
    .setCookies('session', user.sessionToken, { httpOnly: true, secure: true })
    .build();
});
```

---

## Best Practices

* Always start with `.as.*` — it communicates HTTP intent clearly.
* Use `.status()` only when no preset fits.
* Use `forceSuccess()` sparingly — only when business logic requires diverging from HTTP semantics.
* Use `wrap()` for async data to avoid boilerplate try/catch in routes.
* Use `when()` instead of inline conditionals to keep chains readable.
* Set `environment: 'production'` on the adapter in production deployments.

---

## Final Note

Chaining is not just syntactic sugar.

When used properly, it turns your response layer into a predictable, composable, and maintainable system — which directly improves backend quality, debugging experience, and team scalability.
