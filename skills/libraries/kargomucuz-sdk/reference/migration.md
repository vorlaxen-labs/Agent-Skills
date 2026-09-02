# Migration Guide

Upgrading legacy Kargomucuz SDK integrations to `@vorlaxen-labs/kargomucuz-sdk` **v1.0.5**.

---

## Legacy vs Current `track()` API

The current SDK (`v1.0.0+` on npm, latest **1.0.5**) uses a shipment-ID-based trace endpoint.

| Legacy (pre-refactor) | Current (v1.0.5) |
|---|---|
| `track(trackingNumber: string)` | `track(shipmentId: string)` |
| `POST /v1/track` with `{ trackingNumber }` | `GET /v1/shipments/traces/{userId}/{trackingId}` |
| `result.events` | `result.refinedTraces.data` |

```typescript
// Legacy
const result = await client.shipments.track(barcode);
const events = result.events;

// Current (v1.0.5)
const result = await client.shipments.track(created.id);
const events = result.refinedTraces.data;
```

> **WARNING:** Pass `created.id` (the shipment ID returned from `createByAddressIds()` or `create()`), not the barcode, reference code, or agreement number.

> **NOTE:** There is no published npm `v1.0.4` tag. If you are already on `@vorlaxen-labs/kargomucuz-sdk@1.0.0` or later from npm, you already have the current trace endpoint — verify your code passes a **shipment ID**, not a barcode object.

---

## New Features in v1.0.5

These methods are available without breaking existing code:

| Method | Description |
|---|---|
| `createByAddressIds()` | Recommended shipment creation via address IDs |
| `retrieve()` | Alias for `getDetail()` |
| `getDetailRaw()` | Raw API payload |
| `list()` | List shipments with filters |
| `delete()` / `cancel()` | Cancel shipments |
| `getProviders()` | List available carriers |
| `getProviderDetail()` | Single provider details |
| `getProviderEnums()` | Provider enum values |
| `convertShipmentId()` | Best-effort ID conversion |
| `convertShipmentReferenceCode()` | Best-effort reference conversion |
| `resolveTracking()` | Poll until KP barcode is ready |

### Config options

```typescript
interface KargomucuzConfig {
  baseUrl?: string;
  convertTimeout?: number;
  logResponses?: boolean;
}
```

Default `timeout` is `30000` ms in the current SDK. Legacy pre-refactor code used `10000` ms — only relevant if upgrading from unpublished internal builds.

### New exports

Shipment types and tracking utilities are exported from the package entry point. See [API Reference](reference/api-reference.md) and [Tracking Utilities](reference/tracking.md).

### ShipmentResult fields

The barcode model includes:

| Field | Description |
|---|---|
| `referenceCode` | Numeric reference |
| `agreementNumber` | KP barcode (PTT queryable) |
| `trackingBarcode` | Best available barcode |
| `handlerTrackingLink` | Carrier tracking URL |
| `isPttQueryable` | Whether PTT queries are supported |
| `transactionId` | Transaction ID alias |

---

## Migration Checklist

- [ ] Update package: `npm install @vorlaxen-labs/kargomucuz-sdk@1.0.5`
- [ ] Replace legacy `track(barcode)` with `track(shipmentId)`
- [ ] Replace `result.events` with `result.refinedTraces.data`
- [ ] Store `shipment.id` on your order model for trace queries
- [ ] Consider switching to `createByAddressIds()` for cleaner integrations
- [ ] Consider using `resolveTracking()` instead of manual barcode polling
- [ ] Review timeout defaults if you relied on a 10s timeout from legacy internal builds
- [ ] Add `convertTimeout` if using convert endpoints heavily

---

## Recommended Post-Migration Pattern

```typescript
const created = await client.shipments.createByAddressIds({
  senderAddressId,
  receiverAddressId,
  providerServiceCode: ProviderServiceCode.PTT_STANDART_2,
  packageInfo,
});

const resolved = await client.shipments.resolveTracking(created.id);

await orderRepository.update(orderId, {
  shipmentId: created.id,
  trackingBarcode: resolved.trackingBarcode,
  isPttQueryable: resolved.isPttQueryable,
});

const traces = await client.shipments.track(created.id);
```

---

## Test Commands

Verify your integration after upgrading:

| Script | Description |
|---|---|
| `npm run test:unit` | Mock tests (no API key required) |
| `npm run test:e2e` | Live API full lifecycle (requires `KM_API_KEY`) |
| `npm test` | All tests |
| `npm run test:ci` | CI unit tests |

The E2E test suite covers the full public SDK surface: addresses, rates, providers, shipment CRUD, track, resolveTracking, convert, and cancel.
