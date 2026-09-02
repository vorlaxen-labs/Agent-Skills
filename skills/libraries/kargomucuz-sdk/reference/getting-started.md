# Getting Started

This guide covers installation, client setup, environment configuration, and your first successful API call.

---

## Installation

```bash
pnpm add @vorlaxen-labs/kargomucuz-sdk
```

**Runtime dependency:** `axios` (bundled with the SDK).

---

## Environment Variables

Create a `.env` file in your backend project:

```bash
KARGOMUCUZ_API_KEY=your_api_key_here
KARGOMUCUZ_USER_ID=0
KARGOMUCUZ_API_URL=https://api.kargomucuz.com
KM_ENVIRONMENT=development
KM_TIMEOUT=30000
KM_CONVERT_TIMEOUT=4000
```

| Variable | Alias | Description |
|---|---|---|
| `KARGOMUCUZ_API_KEY` | `KM_API_KEY` | API key (required) |
| `KARGOMUCUZ_USER_ID` | — | User ID for scoped operations (default: `0`) |
| `KARGOMUCUZ_API_URL` | — | Base URL override |
| `KM_ENVIRONMENT` | — | `development` or `production` |
| `KM_TIMEOUT` | — | Request timeout in ms (default: `30000`) |
| `KM_CONVERT_TIMEOUT` | — | Convert endpoint timeout in ms (default: `4000`) |

Load with `dotenv` or your framework's env loader before initializing the client.

> **WARNING:** 
---

## Create the Client

```typescript
import { Kargomucuz } from '@vorlaxen-labs/kargomucuz-sdk';

const client = new Kargomucuz({
  auth: {
    apiKey: process.env.KARGOMUCUZ_API_KEY!,
  },
  baseUrl: process.env.KARGOMUCUZ_API_URL,
  environment: process.env.KM_ENVIRONMENT === 'production' ? 'production' : 'development',
  timeout: Number(process.env.KM_TIMEOUT ?? 30_000),
  convertTimeout: Number(process.env.KM_CONVERT_TIMEOUT ?? 4_000),
  logger: process.env.KM_ENVIRONMENT !== 'production' ? console : undefined,
}).asUser(process.env.KARGOMUCUZ_USER_ID ?? '0');
```

See [Configuration](reference/configuration.md) for all options.

---

## User Context

Address and shipment operations are scoped to a user ID. The default user ID is `"0"`.

For multi-tenant applications, scope the client before operations:

```typescript
const userClient = client.asUser('account-user-id-here');

const { senders, receivers } = await userClient.addresses.list();
const shipment = await userClient.shipments.createByAddressIds({ ... });
```

`asUser()` returns `this` — method chaining is supported:

```typescript
const addresses = await client.asUser(userId).addresses.list();
```

---

## Service Namespaces

| Namespace | Key Methods | Purpose |
|---|---|---|
| `client.addresses` | `create`, `list`, `retrieve`, `resolve` | Address book management |
| `client.rates` | `get` | Shipping price quotes |
| `client.shipments` | `createByAddressIds`, `getDetail`, `list`, `track`, `resolveTracking`, `cancel` | Shipment lifecycle |

```typescript
await client.addresses.create(options);
await client.addresses.list();
await client.addresses.retrieve(id);
await client.addresses.resolve(id);

await client.rates.get({ serviceCode, weightOrDesi });

await client.shipments.createByAddressIds(request);
await client.shipments.getDetail(shipmentId);
await client.shipments.resolveTracking(shipmentId);
await client.shipments.track(shipmentId);
```

> **TIP:** 
---

## First API Call: Get a Rate

The simplest way to verify your API key works:

```typescript
import { Kargomucuz, ProviderServiceCode } from '@vorlaxen-labs/kargomucuz-sdk';

const client = new Kargomucuz({
  auth: { apiKey: process.env.KARGOMUCUZ_API_KEY! },
  environment: 'development',
  logger: console,
});

async function main() {
  const rate = await client.rates.get({
    serviceCode: ProviderServiceCode.PTT_STANDART_2,
    weightOrDesi: 2,
  });

  console.log(`Quote: ${rate.amount} ${rate.currency}`);
  console.log(`Provider: ${rate.providerCode}`);
}

main().catch(console.error);
```

In `development` mode with `logger: console`, the SDK logs the full HTTP request and response to stdout.

---

## Singleton Pattern (Recommended for Backends)

```typescript
import { Kargomucuz } from '@vorlaxen-labs/kargomucuz-sdk';

let client: Kargomucuz | null = null;

export function getKargomucuzClient(): Kargomucuz {
  if (!client) {
    client = new Kargomucuz({
      auth: { apiKey: process.env.KARGOMUCUZ_API_KEY! },
      environment: 'production',
      timeout: 30_000,
    });
  }
  return client;
}
```

Import `getKargomucuzClient()` in services instead of creating a new client per request.

---

## Inspect Client State

```typescript
client.getConfig();
client.getUserId();
client.getBaseUrl();
client.getHttpClient();
```

| Method | Returns |
|---|---|
| `getConfig()` | Frozen `KargomucuzConfig` object |
| `getUserId()` | Current user ID (`"0"` by default) |
| `getBaseUrl()` | `"https://api.kargomucuz.com"` |
| `getHttpClient()` | Internal `HttpClient` instance |

---

## Error Handling Basics

All SDK methods throw typed errors on failure:

```typescript
import { APIError, AuthError, KargomucuzError } from '@vorlaxen-labs/kargomucuz-sdk';

try {
  await client.rates.get({ serviceCode: 'invalid', weightOrDesi: 1 });
} catch (error) {
  if (error instanceof AuthError) {
    console.error('Invalid API key');
  } else if (error instanceof APIError) {
    console.error(`API error ${error.statusCode}: ${error.message}`);
  } else if (error instanceof KargomucuzError) {
    console.error(`SDK error: ${error.message}`);
  }
}
```

See [Errors & Types](reference/errors.md) for the full error hierarchy.

---

## Next Steps

| Topic | Link |
|---|---|
| All config options | [Configuration](reference/configuration.md) |
| HTTP layer internals | [Client Architecture](reference/client-architecture.md) |
| Carrier selection | [Providers & Enums](reference/providers.md) |
| Full shipping flow | [Workflows](reference/workflows.md) |
| Upgrading from legacy API | [Migration Guide](reference/migration.md) |
| Production patterns | [Recipes & Patterns](reference/recipes.md) |
