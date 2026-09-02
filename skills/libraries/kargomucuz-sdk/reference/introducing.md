# Kargomucuz SDK

**Official SDK for Kargomucuz. Unified cargo operations, shipment automation, and enterprise-grade logistics infrastructure.**

`@vorlaxen-labs/kargomucuz-sdk` provides a strongly-typed TypeScript client for the Kargomucuz REST API — designed for e-commerce platforms, ERP systems, marketplaces, warehouse software, and modern Node.js backends operating in the Turkish logistics ecosystem.

| Field | Value |
|---|---|
| npm | `@vorlaxen-labs/kargomucuz-sdk` |
| Version | `1.0.5` |
| Module type | ESM (`"type": "module"`) |
| Entry | `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts` |
| Base API URL | `https://api.kargomucuz.com` |
| API reference | [kargomucuz-api-docs.vercel.app](https://kargomucuz-api-docs.vercel.app) |

---

## The Problem This SDK Solves

Cargo integrations in Türkiye are typically fragmented:

- Different authentication schemes per carrier
- Inconsistent tracking and label formats
- Legacy XML/SOAP interfaces with unstable schemas
- Unpredictable error payloads across providers
- Manual HTTP wiring duplicated in every project

This SDK normalizes the entire experience into a single, predictable developer workflow with typed requests, typed responses, and structured error classes.

---

## Features

- **Unified API Abstraction:** One client for addresses, rates, and shipments
- **Multi-Carrier Support:** PTT, Hepsijet, Sürat, UPS, KolayGelsin, Yurtiçi via `ProviderServiceCode`
- **Strictly Typed:** Full TypeScript interfaces for all payloads and responses
- **Modular Services:** `client.addresses`, `client.rates`, `client.shipments`
- **User Context:** Scope operations per account with `asUser()`
- **Axios-Based HTTP:** Built-in interceptors for auth, logging, and error normalization
- **Structured Errors:** `APIError`, `AuthError`, `KargomucuzError`
- **Tracking Utilities:** KP barcode resolution, PTT URL generation, handler link extraction
- **Configurable Logging:** Custom logger or `console` output in development

---

## SDK Structure

```
Kargomucuz (client)
├── addresses   → create, list, retrieve, resolve
├── rates       → get (price quote by carrier + desi/kg)
└── shipments   → create, createByAddressIds, getDetail, list, track,
                  resolveTracking, cancel, getProviders, getProviderDetail,
                  getProviderEnums, convertShipmentId, convertShipmentReferenceCode
```

Services receive a shared `HttpClient` via constructor injection — they do **not** extend it.

**Base URL:** `https://api.kargomucuz.com`

---

## Critical Notes (v1.0.5)

> **WARNING:** `shipments.track()` accepts a **shipment ID** (`created.id`), not a barcode or reference code. See [Migration Guide](reference/migration.md).
> **TIP:** - Use `createByAddressIds()` for most integrations — pass stored address IDs directly.
- Use `resolveTracking()` to poll until the KP barcode is ready for PTT queries.
- `convert*()` endpoints are best-effort; returning `null` on new shipments is normal.
- Call `asUser(userId)` for multi-tenant address and shipment operations.
---

## Quick Example

```typescript
import { Kargomucuz, ProviderServiceCode, Currency } from '@vorlaxen-labs/kargomucuz-sdk';

const client = new Kargomucuz({
  auth: { apiKey: process.env.KARGOMUCUZ_API_KEY! },
  environment: 'production',
}).asUser(process.env.KARGOMUCUZ_USER_ID ?? '0');

const rate = await client.rates.get({
  serviceCode: ProviderServiceCode.PTT_STANDART_2,
  weightOrDesi: 2,
});

const created = await client.shipments.createByAddressIds({
  senderAddressId: '...',
  receiverAddressId: '...',
  providerServiceCode: ProviderServiceCode.PTT_STANDART_2,
  packageInfo: {
    desiOrKg: '0.5',
    width: '0.01',
    height: '0.01',
    depth: '0.01',
    weight: '0.5',
    itemsAmountCurrency: Currency.TRY,
    itemsTaxAmount: 0,
    itemsAmount: 0,
    items: [],
  },
});

const resolved = await client.shipments.resolveTracking(created.id);
const traces = await client.shipments.track(created.id);
```

---

## Documentation Map

| Section | What you'll learn |
|---|---|
| [Getting Started](reference/getting-started.md) | Installation, first client, first API call |
| [Configuration](reference/configuration.md) | All config options, env vars, logging |
| [Client Architecture](reference/client-architecture.md) | HTTP layer, interceptors, response envelope |
| [Providers & Enums](reference/providers.md) | Carrier codes, currency enum, provider listing |
| [Addresses](reference/addresses.md) | CRUD, resolve, API mapping |
| [Rates](reference/rates.md) | Quote comparison, carrier selection |
| [Shipments](reference/shipments.md) | Create, track, resolveTracking, CRUD |
| [Tracking Utilities](reference/tracking.md) | Barcode resolution, PTT URLs, handler links |
| [Workflows](reference/workflows.md) | End-to-end checkout shipping flow |
| [Migration Guide](reference/migration.md) | Upgrading from legacy tracking API to 1.0.5 |
| [Errors & Types](reference/errors.md) | Error hierarchy, handling patterns |
| [TypeScript Guide](reference/typescript.md) | Types, enums, service interfaces |
| [Recipes & Patterns](reference/recipes.md) | E-commerce, ERP, marketplace patterns |
| [API Reference](reference/api-reference.md) | Complete method listing |

---

## Built For

- E-commerce checkout shipping integrations
- ERP and warehouse management systems
- Marketplace seller fulfillment automation
- Multi-tenant SaaS with per-user address books
- Modern Node.js / TypeScript backends

---

## Official Links

- **Website:** https://kargomucuz.com
- **API Platform:** https://api.kargomucuz.com
- **API Docs:** https://kargomucuz-api-docs.vercel.app
- **GitHub:** https://github.com/vorlaxen-labs

---

## When to Use This SDK

Use the SDK when you need programmatic access to Kargomucuz for:

- Creating and managing sender/receiver address books
- Quoting shipping rates across multiple carriers
- Creating shipments, resolving tracking barcodes, and fetching trace events

Use the Kargomucuz web dashboard directly when you need manual operations, bulk imports, or carrier account configuration.

---

## License

Distributed under the MIT License. Built by **Vorlaxen Labs**.

> **INFO:**
