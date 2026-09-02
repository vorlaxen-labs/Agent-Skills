---
name: kargomucuz-sdk
npmPackage: "@vorlaxen-labs/kargomucuz-sdk"
npmVersion: "1.0.5"
description: >-
  Official TypeScript SDK for Kargomucuz cargo API (@vorlaxen-labs/kargomucuz-sdk).
  Covers addresses, rates, shipments, tracking, multi-carrier logistics, and error
  handling. Use when integrating Kargomucuz, Turkish cargo/shipping, PTT/Hepsijet/Sürat
  carriers, shipment creation, rate quotes, or resolveTracking/track workflows.
---
# Kargomucuz SDK

**Package:** `@vorlaxen-labs/kargomucuz-sdk` v1.0.5 · **Base URL:** `https://api.kargomucuz.com`

Unified TypeScript client for Kargomucuz REST API — addresses, rate quotes, shipment lifecycle, and tracking across Turkish carriers (PTT, Hepsijet, Sürat, UPS, KolayGelsin, Yurtiçi).

---

## Critical Rules

1. **`track(shipmentId)`** — pass `created.id` (shipment ID), **not** barcode or reference code. Traces live in `result.refinedTraces.data`.
2. **Prefer `createByAddressIds()`** when sender/receiver address IDs already exist.
3. **Use `resolveTracking(shipmentId)`** before PTT queries — polls until KP barcode is ready.
4. **Scope multi-tenant ops** with `.asUser(userId)` before address/shipment calls.
5. **`convert*()` endpoints are best-effort** — returning `null` on new shipments is normal.
6. **Never invent API fields** — read [reference/api-reference.md](reference/api-reference.md) for exact types.

---

## Quick Start

```typescript
import { Kargomucuz, ProviderServiceCode, Currency } from '@vorlaxen-labs/kargomucuz-sdk';

const client = new Kargomucuz({
  auth: { apiKey: process.env.KARGOMUCUZ_API_KEY! },
  environment: 'production',
  timeout: 30_000,
}).asUser(process.env.KARGOMUCUZ_USER_ID ?? '0');

// Verify API key
const rate = await client.rates.get({
  serviceCode: ProviderServiceCode.PTT_STANDART_2,
  weightOrDesi: 2,
});

// Create shipment
const created = await client.shipments.createByAddressIds({
  senderAddressId: '...',
  receiverAddressId: '...',
  providerServiceCode: ProviderServiceCode.PTT_STANDART_2,
  packageInfo: {
    desiOrKg: '0.5', width: '0.01', height: '0.01', depth: '0.01', weight: '0.5',
    itemsAmountCurrency: Currency.TRY, itemsTaxAmount: 0, itemsAmount: 0, items: [],
  },
});

// Resolve barcode, then track
const resolved = await client.shipments.resolveTracking(created.id);
const traces = await client.shipments.track(created.id);
```

---

## Client Structure

```
Kargomucuz
├── addresses   → create, list, retrieve, resolve
├── rates       → get (price quote by carrier + desi/kg)
└── shipments   → create, createByAddressIds, getDetail, list, track,
                  resolveTracking, cancel, providers, convert*
```

| Env Variable | Alias | Purpose |
|---|---|---|
| `KARGOMUCUZ_API_KEY` | `KM_API_KEY` | API key (required) |
| `KARGOMUCUZ_USER_ID` | — | User scope (default `"0"`) |
| `KARGOMUCUZ_API_URL` | — | Base URL override |
| `KM_ENVIRONMENT` | — | `development` or `production` |
| `KM_TIMEOUT` | — | Request timeout ms (default `30000`) |
| `KM_CONVERT_TIMEOUT` | — | Convert endpoint timeout ms (default `4000`) |

---

## Error Handling

```typescript
import { APIError, AuthError, KargomucuzError } from '@vorlaxen-labs/kargomucuz-sdk';

try {
  await client.shipments.createByAddressIds(request);
} catch (error) {
  if (error instanceof AuthError) { /* 401/403 — invalid API key */ }
  else if (error instanceof APIError) { /* API status: false or HTTP error */ }
  else if (error instanceof KargomucuzError) { /* SDK-level error */ }
}
```

---

## ProviderServiceCode

| Member | Value |
|---|---|
| `PTT_FIXED_PRICE` | `ptt_fixed_price` |
| `PTT_STANDART_2` | `ptt_standart_2` |
| `HEPSIJET_STANDART_2` | `hepsijet_standart_2` |
| `SURAT_STANDART_2` | `surat_standart_2` |
| `UPS_STANDART_2` | `ups_standart_2` |
| `KOLAYGELSIN_STANDART_2` | `kolaygelsin_standart_2` |
| `YURTICI_STANDART_2` | `yurtici_standart_2` |

---

## E-Commerce Workflow

```
1. Create/reuse receiver address
2. Quote rates (parallel across carriers)
3. Customer selects carrier + pays
4. createByAddressIds()
5. resolveTracking() until KP barcode ready
6. track(shipmentId) for trace events
```

See [reference/workflows.md](reference/workflows.md) for full implementations.

---

## Reference Documentation

Read these before implementing non-trivial features:

| Topic | File |
|---|---|
| Installation & env setup | [reference/getting-started.md](reference/getting-started.md) |
| Full API types & endpoints | [reference/api-reference.md](reference/api-reference.md) |
| Shipment lifecycle | [reference/shipments.md](reference/shipments.md) |
| Address CRUD | [reference/addresses.md](reference/addresses.md) |
| Rate quotes | [reference/rates.md](reference/rates.md) |
| Tracking utilities | [reference/tracking.md](reference/tracking.md) |
| End-to-end flows | [reference/workflows.md](reference/workflows.md) |
| Error hierarchy | [reference/errors.md](reference/errors.md) |
| Upgrade from legacy API | [reference/migration.md](reference/migration.md) |
| Production patterns | [reference/recipes.md](reference/recipes.md) |
| Config options | [reference/configuration.md](reference/configuration.md) |
| HTTP layer internals | [reference/client-architecture.md](reference/client-architecture.md) |

**External:** [kargomucuz-api-docs.vercel.app](https://kargomucuz-api-docs.vercel.app)
