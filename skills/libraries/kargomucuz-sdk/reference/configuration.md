# Configuration

Complete reference for initializing and configuring the Kargomucuz client.

---

## KargomucuzConfig

```typescript
interface KargomucuzConfig {
  auth: { apiKey: string };
  baseUrl?: string;
  environment?: 'production' | 'development';
  timeout?: number;
  convertTimeout?: number;
  logger?: IKargomucuzLogger | boolean;
  logResponses?: boolean;
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `auth.apiKey` | `string` | required | Bearer token for API authentication |
| `baseUrl` | `string` | `https://api.kargomucuz.com` | API base URL override |
| `environment` | `'production' \| 'development'` | `'production'` | Controls logging verbosity |
| `timeout` | `number` | `30000` | HTTP request timeout in milliseconds |
| `convertTimeout` | `number` | `4000` | Timeout for `/others/*` convert endpoints |
| `logger` | `IKargomucuzLogger \| boolean` | `false` | Custom logger or `true` for console output |
| `logResponses` | `boolean` | `false` in production | Log response payloads when logger is enabled |

---

## Required: `auth.apiKey`

Your Kargomucuz API key. Sent as a Bearer token on every request:

```
Authorization: Bearer {apiKey}
```

```typescript
const client = new Kargomucuz({
  auth: {
    apiKey: process.env.KARGOMUCUZ_API_KEY!,
  },
});
```

Obtain your API key from the Kargomucuz dashboard at https://kargomucuz.com.

---

## `baseUrl`

Override the default API base URL. Useful for staging environments or proxy setups.

```typescript
const client = new Kargomucuz({
  auth: { apiKey: process.env.KARGOMUCUZ_API_KEY! },
  baseUrl: process.env.KARGOMUCUZ_API_URL ?? 'https://api.kargomucuz.com',
});
```

---

## `environment`

| Value | Behavior |
|---|---|
| `'production'` | Default. Minimal logging. No request/response body logs unless `logResponses: true`. |
| `'development'` | Verbose HTTP logging when `logger` is enabled. |

```typescript
const client = new Kargomucuz({
  auth: { apiKey: process.env.KARGOMUCUZ_API_KEY! },
  environment: 'development',
  logger: console,
});
```

In development mode **with `logger` enabled**, the SDK logs:
- HTTP method and full URL
- Query parameters (JSON)
- Request body (JSON)
- Response payload (when `logResponses` is enabled or in development)

Use development mode only in local/staging environments — never in production with real customer data unless log output is secured.

---

## `timeout`

Request timeout in milliseconds. Default: `30000` (30 seconds).

```typescript
const client = new Kargomucuz({
  auth: { apiKey: process.env.KARGOMUCUZ_API_KEY! },
  timeout: 30_000,
});
```

Increase timeout for shipment creation if your carrier integration is slow during peak hours.

---

## `convertTimeout`

Timeout for `/others/*` convert endpoints (`convert-address-id`, `convert-shipment-id`, etc.). Default: `4000` (4 seconds).

```typescript
const client = new Kargomucuz({
  auth: { apiKey: process.env.KARGOMUCUZ_API_KEY! },
  convertTimeout: 4_000,
});
```

These endpoints are best-effort lookups — a shorter timeout prevents blocking your main request flow.

---

## `logger`

Controls SDK-internal logging output.

### Disable Logging (Default in Production)

```typescript
const client = new Kargomucuz({
  auth: { apiKey: process.env.KARGOMUCUZ_API_KEY! },
});
```

### Console Logging

```typescript
const client = new Kargomucuz({
  auth: { apiKey: process.env.KARGOMUCUZ_API_KEY! },
  logger: console,
});
```

Equivalent to `logger: true`.

### Custom Logger

Implement `IKargomucuzLogger`:

```typescript
interface IKargomucuzLogger {
  info(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  warn?(message: string, ...args: any[]): void;
  debug?(message: string, ...args: any[]): void;
}
```

```typescript
import pino from 'pino';

const logger = pino({ level: 'info' });

const client = new Kargomucuz({
  auth: { apiKey: process.env.KARGOMUCUZ_API_KEY! },
  logger: {
    info: (msg, meta) => logger.info(meta, msg),
    error: (msg, meta) => logger.error(meta, msg),
  },
});
```

Log prefix: `[KM-SDK]` for info, `[KM-SDK-ERROR]` for errors.

---

## `logResponses`

When `true`, response payloads are logged even in production (requires `logger` to be set). Default: `false` in production.

```typescript
const client = new Kargomucuz({
  auth: { apiKey: process.env.KARGOMUCUZ_API_KEY! },
  logger: customLogger,
  logResponses: true,
});
```

---

## HTTP Headers (Automatic)

The SDK sets these headers on every request — no manual configuration needed:

| Header | Value |
|---|---|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer {apiKey}` |
| `X-SDK-Client` | `true` |

---

## Environment Variable Pattern

Production-ready config factory:

```typescript
import { Kargomucuz } from '@vorlaxen-labs/kargomucuz-sdk';

function createKargomucuzClient(): Kargomucuz {
  const apiKey = process.env.KARGOMUCUZ_API_KEY ?? process.env.KM_API_KEY;

  if (!apiKey) {
    throw new Error('KARGOMUCUZ_API_KEY environment variable is required');
  }

  const isProd = process.env.KM_ENVIRONMENT === 'production'
    || process.env.NODE_ENV === 'production';

  return new Kargomucuz({
    auth: { apiKey },
    baseUrl: process.env.KARGOMUCUZ_API_URL,
    environment: isProd ? 'production' : 'development',
    timeout: Number(process.env.KM_TIMEOUT ?? 30_000),
    convertTimeout: Number(process.env.KM_CONVERT_TIMEOUT ?? 4_000),
    logger: isProd ? undefined : console,
  }).asUser(process.env.KARGOMUCUZ_USER_ID ?? '0');
}
```

---

## Config Immutability

`getConfig()` returns a **frozen** copy of the configuration. Mutating it has no effect on the running client.

```typescript
const config = client.getConfig();
config.timeout = 99999;
client.getConfig().timeout;
```

To change configuration, create a new `Kargomucuz` instance.

---

## Multi-Tenant Configuration

For SaaS platforms serving multiple Kargomucuz accounts, create one client per API key:

```typescript
const clients = new Map<string, Kargomucuz>();

function getClientForTenant(tenantId: string, apiKey: string): Kargomucuz {
  if (!clients.has(tenantId)) {
    clients.set(tenantId, new Kargomucuz({
      auth: { apiKey },
      environment: 'production',
    }));
  }
  return clients.get(tenantId)!;
}
```

Combine with `asUser()` for per-end-user address and shipment scoping within a tenant.

---

## Configuration Checklist

- [ ] API key stored in environment variable, not source code
- [ ] `environment: 'production'` in production deployments
- [ ] `logger` disabled or routed to secure log aggregator in production
- [ ] `timeout` set appropriately for your carrier response times
- [ ] `convertTimeout` set for convert endpoint latency tolerance
- [ ] `asUser()` configured for multi-tenant user scoping
- [ ] Client instantiated once (singleton), not per HTTP request

> **TIP:**
