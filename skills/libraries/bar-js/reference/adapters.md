# Adapters

BaR is not tied to any specific framework. Instead, it uses an **adapter layer** to integrate with different HTTP environments.

At its core, BaR generates a **standardized response object**. Adapters are responsible for taking that object and sending it through the underlying platform (Express, Fastify, serverless, etc.).

> In short: **BaR builds the response, adapters deliver it.**

---

## How It Works

Every response goes through three layers:

1. **Builder (`ResponseBuilder`)** → creates a structured response
2. **Dispatcher (`IBaRDispatcher`)** → translates the result into a platform-specific format
3. **Adapter** → injects everything into your framework lifecycle

This separation is what makes BaR flexible and extensible.

---

## Express Adapter

The Express adapter integrates BaR into the standard middleware pipeline.

### Setup

```typescript
import express from 'express';
import { BarExpressAdapter } from '@vorlaxen-labs/bar-js';

const app = express();

const bar = new BarExpressAdapter({
  withDefaultHeaders: true,
  environment: 'production',
  logger: console,
});

app.use(bar.handler());
app.use(express.json());
```

> **TIP:** Register `bar.handler()` before route handlers so every route gets `res.builder` and `req.bar.ctx`. Body parsing (`express.json()`) can follow immediately after.
```

### What It Does

Once registered:

* Injects `res.builder` → your response builder instance
* Injects `req.bar.ctx` → request context (`request_id`, `start_time`)
* Automatically applies default headers (if `withDefaultHeaders: true`)
* Handles final response dispatch via `.build()`

### Example

```typescript
app.get('/api/example', (req, res) => {
  return res.builder
    .as.ok({ hello: 'world' }, 'Success')
    .build();
});
```

### Under the Hood

When you call `.build()`, BaR:

1. Creates a standardized response object
2. Passes it to the `ExpressDispatcher`
3. Internally calls `res.status(statusCode).json(body)` and applies headers/cookies

Express TypeScript types for `req.bar` and `res.builder` are shipped with the package.

---

## Other Frameworks (Fastify, Hono, etc.)

BaR v2 ships a first-class Express adapter. For other frameworks, implement a custom dispatcher using `ResponseBuilder` and `IBaRDispatcher`.

### Fastify Example

```typescript
import Fastify from 'fastify';
import { ResponseBuilder, type IBaRDispatcher, type BaRFinalResult } from '@vorlaxen-labs/bar-js';

class FastifyDispatcher implements IBaRDispatcher {
  constructor(private reply: any) {}

  dispatch(result: BaRFinalResult): BaRFinalResult {
    for (const [key, value] of Object.entries(result.headers)) {
      this.reply.header(key, value);
    }

    for (const cookie of result.cookies) {
      this.reply.setCookie(cookie.name, cookie.value, cookie.options);
    }

    this.reply.status(result.statusCode).send(result.body);
    return result;
  }
}

const fastify = Fastify();

fastify.addHook('onRequest', async (req, reply) => {
  (reply as any).builder = new ResponseBuilder(new FastifyDispatcher(reply));
});

fastify.get('/api/example', async (req, reply) => {
  return (reply as any).builder
    .as.ok({ hello: 'world' })
    .build();
});
```

---

## Vanilla Node.js (No Framework)

BaR can be used without any framework by interacting directly with its core.

```typescript
import { ResponseBuilder } from '@vorlaxen-labs/bar-js';
import type { IBaRDispatcher, BaRFinalResult } from '@vorlaxen-labs/bar-js';
import http from 'http';

class NodeDispatcher implements IBaRDispatcher {
  constructor(private res: http.ServerResponse) {}

  dispatch(result: BaRFinalResult): BaRFinalResult {
    this.res.writeHead(result.statusCode, result.headers);
    this.res.end(JSON.stringify(result.body));
    return result;
  }
}

http.createServer((req, res) => {
  const builder = new ResponseBuilder(new NodeDispatcher(res));
  builder.as.ok({ hello: 'world' }).build();
}).listen(3000);
```

---

## Creating a Custom Adapter

### Step 1: Implement a Dispatcher

```typescript
import { IBaRDispatcher, BaRFinalResult } from '@vorlaxen-labs/bar-js';

class MyDispatcher implements IBaRDispatcher {
  constructor(private reply: any) {}

  dispatch(result: BaRFinalResult): BaRFinalResult {
    this.reply.status(result.statusCode);

    for (const [key, value] of Object.entries(result.headers)) {
      this.reply.setHeader(key, value);
    }

    this.reply.send(result.body);
    return result;
  }
}
```

### Step 2: Inject the Builder

```typescript
import { ResponseBuilder, BaRContextFactory } from '@vorlaxen-labs/bar-js';

app.use((req, res, next) => {
  const ctx = BaRContextFactory.create(req);
  req.bar = { ctx };
  res.builder = new ResponseBuilder(new MyDispatcher(res), undefined, ctx);
  next();
});
```

---

## Integration Comparison

| Feature | Express | Custom / Vanilla |
|---|---|---|
| Integration | Middleware (`BarExpressAdapter`) | Manual dispatcher |
| Builder Injection | `res.builder` | Custom property |
| Setup Effort | Low | Medium |
| Performance | Standard | Max |
| Flexibility | Medium | Unlimited |

---

## Default Security Headers

When `withDefaultHeaders: true`, BaR injects security headers via `DEFAULT_SECURITY_HEADERS`. Custom headers set via `setHeaders()` are merged on top and override defaults when keys collide.

---

## Final Note

BaR is not just a helper utility.

It is a **response engine**.

Adapters are the thin layer that lets it run anywhere.

Once you understand this separation, you can plug BaR into virtually any backend stack.
