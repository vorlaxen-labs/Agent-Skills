# Shipments

The `shipments` service handles the full shipment lifecycle — creation, listing, tracking, cancellation, and provider discovery.

```typescript
await client.shipments.createByAddressIds(request);
await client.shipments.resolveTracking(shipmentId);
await client.shipments.track(shipmentId);
```

---

## Prerequisites

Before creating a shipment:

1. Create or retrieve **sender** and **receiver** addresses — [Addresses](reference/addresses.md)
2. Optionally query rates to select a carrier — [Rates](reference/rates.md)

---

## Recommended: `createByAddressIds(request)`

Creates a shipment using stored address IDs. This is the preferred method for most integrations.

```typescript
interface CreateShipmentByAddressIdsRequest {
  senderAddressId: string;
  receiverAddressId: string;
  providerServiceCode: ProviderServiceCode;
  packageInfo: ShipmentPackageInfo;
  title?: string;
  explanation?: string;
  buyerPayShipping?: boolean;
  buyerPayProduct?: boolean;
  buyerPayShippingPaymentType?: string;
}
```

| Field | Default | Description |
|---|---|---|
| `title` | `"Shipment"` | Shipment title shown in dashboard |
| `explanation` | `""` | Additional notes for the carrier |
| `buyerPayShipping` | `false` | Buyer pays shipping cost on delivery |
| `buyerPayProduct` | `false` | Buyer pays product cost on delivery (COD) |
| `buyerPayShippingPaymentType` | — | e.g. `"creditcard"` |

**Endpoint:** `POST /v1/shipments/{userId}`

### Example

```typescript
import {
  Kargomucuz,
  ProviderServiceCode,
  Currency,
} from '@vorlaxen-labs/kargomucuz-sdk';

const client = new Kargomucuz({
  auth: { apiKey: process.env.KARGOMUCUZ_API_KEY! },
}).asUser(userId);

const created = await client.shipments.createByAddressIds({
  senderAddressId: senderId,
  receiverAddressId: receiverId,
  providerServiceCode: ProviderServiceCode.PTT_STANDART_2,
  title: 'Order #123',
  buyerPayShippingPaymentType: 'creditcard',
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
```

---

## `create(request)`

Creates a shipment using full `Address` objects. Internally delegates to `createByAddressIds()` using `sender.id` and `receiver.id`.

```typescript
interface CreateShipmentRequest {
  sender: Address;
  receiver: Address;
  providerServiceCode: ProviderServiceCode;
  packageInfo: ShipmentPackageInfo;
  title?: string;
  explanation?: string;
  buyerPayShipping?: boolean;
  buyerPayProduct?: boolean;
  buyerPayShippingPaymentType?: string;
}
```

Use when you already have full address objects from `retrieve()` or `create()`.

---

## Package Info

```typescript
interface ShipmentPackageInfo {
  desiOrKg: string;
  width: string;
  height: string;
  depth: string;
  weight: string;
  itemsAmountCurrency: Currency;
  itemsTaxAmount: number;
  itemsAmount: number;
  items: ShipmentItem[];
}

interface ShipmentItem {
  name: string;
  quantity: number;
  unitPrice: number;
}
```

All dimension and weight fields are **strings** — pass numeric values as string literals.

---

## ShipmentResult

```typescript
interface ShipmentResult {
  id: string;
  transactionId?: string;
  providerServiceCode: string;
  status?: string;
  createdAt?: string;
  referenceCode: string;
  agreementNumber?: string;
  trackingBarcode: string;
  handlerTrackingLink?: string;
  isPttQueryable: boolean;
  savedSenderAddress?: Address | null;
  savedReceiverAddress?: Address | null;
}
```

### Barcode Logic

| Field | Description |
|---|---|
| `referenceCode` | Numeric reference (e.g. `2995045154518`) |
| `agreementNumber` | KP barcode (e.g. `KP06496651733`) — PTT queryable |
| `trackingBarcode` | Best available barcode: `agreementNumber` → `barcode` → `referenceCode` → `labelBarcode` |
| `isPttQueryable` | `true` when a KP-format barcode exists (`/^KP\d+$/i`) |
| `handlerTrackingLink` | Carrier handler tracking URL when available |

PTT URL template: `https://gonderitakip.ptt.gov.tr/Track/Verify?q={barcode}`

> **INFO:** The API may return `savedReceieverAddress` (typo). The SDK normalizes this to `savedReceiverAddress`.
---

## `getDetail(shipmentId)` / `retrieve(shipmentId)`

Retrieves the current state of a shipment including tracking information. `retrieve()` is an alias for `getDetail()`.

```typescript
const detail = await client.shipments.getDetail(shipmentId);

console.log(detail.trackingBarcode);
console.log(detail.isPttQueryable);
```

**Endpoint:** `GET /v1/shipments/{userId}/{shipmentId}`

---

## `getDetailRaw(shipmentId)`

Returns the raw API payload without SDK mapping. Useful for debugging or custom field extraction.

```typescript
const raw = await client.shipments.getDetailRaw(shipmentId);
```

**Endpoint:** `GET /v1/shipments/{userId}/{shipmentId}`

---

## `list(options?)`

Lists shipments with optional filters.

```typescript
interface ListShipmentsOptions {
  startDate?: string;
  endDate?: string;
  shipmentStatus?: string;
  search?: string;
}

interface ShipmentListResult {
  shipments: ShipmentResult[];
  totalCount?: number;
}
```

| SDK Option | API Param |
|---|---|
| `startDate` | `start-date` |
| `endDate` | `end-date` |
| `shipmentStatus` | `shipment-status` |
| `search` | `search` |

**Endpoint:** `GET /v1/shipments/{userId}`

---

## `delete(shipmentId)` / `cancel(shipmentId)`

Deletes or cancels a shipment. `cancel()` is an alias for `delete()`.

```typescript
interface DeleteShipmentResult {
  message: string;
  code?: number;
}

await client.shipments.cancel(shipmentId);
```

**Endpoint:** `DELETE /v1/shipments/{userId}/{shipmentId}`

---

## `resolveTracking(shipmentId, options?)`

Polls until the KP barcode is ready for PTT queries. Combines `getDetailRaw()`, convert endpoints, and barcode resolution.

Default: **2 attempts**, **2000ms** delay.

```typescript
interface ResolvedTracking {
  referenceCode: string;
  agreementNumber?: string;
  trackingBarcode: string;
  handlerTrackingLink?: string;
  isPttQueryable: boolean;
  detail: RawShipmentDetail;
  providerServiceCode?: string;
  createdAt?: string;
}

const resolved = await client.shipments.resolveTracking(created.id, {
  attempts: 2,
  delayMs: 2000,
  convertTimeout: 4000,
});
```

### Flow

1. Calls `getDetailRaw(shipmentId)`
2. On first attempt, tries convert endpoints in parallel
3. Resolves barcode via `resolveTrackingBarcode()`
4. Polls until `isPttQueryable === true` or attempts exhausted

---

## `track(trackingId)` — v1.0.5

> **WARNING:** `track()` accepts a **shipment ID** (`created.id`), not a barcode or reference code. See [Migration Guide](reference/migration.md).
Fetches carrier trace events for a shipment.

```typescript
interface TrackingResult {
  trackingId: string;
  trackingNumber: string;
  refinedTraces: { data: HandlerTraceEvent[]; totalCount?: number };
  handlerTraces: { data: HandlerTraceEvent[]; totalCount?: number };
  totalCount?: number;
  raw?: unknown;
}

interface HandlerTraceEvent {
  IKODU?: string;
  IMERK?: string;
  ISAAT?: string;
  ISLEM?: string;
  ITARIH?: string;
  siraNo?: number;
  [key: string]: unknown;
}
```

```typescript
const traces = await client.shipments.track(created.id);
const events = traces.refinedTraces.data;
```

**Endpoint:** `GET /v1/shipments/traces/{userId}/{trackingId}`

`trackingNumber` on `TrackingResult` is deprecated — use `trackingId`.

---

## Provider Methods

### `getProviders(options?)`

```typescript
interface ListProvidersOptions {
  featureCodes?: string;
  type?: string;
}

const providers = await client.shipments.getProviders();
```

**Endpoint:** `GET /v1/shipments/providers`

### `getProviderDetail(providerId)`

**Endpoint:** `GET /v1/shipments/providers/{providerId}`

### `getProviderEnums()`

```typescript
interface ProviderEnumsResult {
  providerEntity: string[];
  providerType: string[];
  providerServiceCode: string[];
}

const enums = await client.shipments.getProviderEnums();
```

**Endpoint:** `GET /v1/shipments/providers/enums`

---

## Convert Methods (Best-Effort)

These endpoints resolve internal IDs. Returning `null` on new shipments is normal.

### `convertShipmentId(id)`

**Endpoint:** `POST /others/convert-shipment-id`

### `convertShipmentReferenceCode(referenceCode)`

**Endpoint:** `POST /others/convert-shipment-reference-code`

```typescript
interface ConvertShipmentResult {
  id?: string;
  kargopaneliId?: string;
  referenceId?: string;
}

const converted = await client.shipments.convertShipmentId(shipmentId);
```

---

## Recommended Integration Flow

```typescript
const created = await client.shipments.createByAddressIds({ ... });

const resolved = await client.shipments.resolveTracking(created.id, {
  attempts: 2,
  delayMs: 2000,
});

const trackingInfo = {
  shipmentId: created.id,
  referenceCode: resolved.referenceCode,
  barcode: resolved.trackingBarcode,
  trackingUrl: resolved.handlerTrackingLink,
  isPttQueryable: resolved.isPttQueryable,
};

const traces = await client.shipments.track(created.id);
const events = traces.refinedTraces.data;
```

---

## COD (Cash on Delivery)

```typescript
await client.shipments.createByAddressIds({
  senderAddressId,
  receiverAddressId,
  providerServiceCode: ProviderServiceCode.SURAT_STANDART_2,
  buyerPayShipping: true,
  buyerPayProduct: true,
  packageInfo: {
    ...packageInfo,
    itemsAmount: 500,
    itemsTaxAmount: 90,
  },
});
```

Verify carrier support for COD before enabling — not all providers support `buyerPayProduct`.

---

## Error Cases

| Error | Cause |
|---|---|
| `AuthError` | Invalid API key |
| `APIError` | Invalid address ID, unsupported carrier, invalid package data |
| `APIError('Shipment could not be created.')` | API returned no payload |

Always persist `shipment.id` to your order record immediately after successful creation.

---

## Idempotency Consideration

The SDK does not provide built-in idempotency keys. Guard against duplicate shipment creation in your service layer:

```typescript
async function createShipmentForOrder(orderId: string) {
  const order = await orderRepository.findById(orderId);

  if (order.shipmentId) {
    return client.shipments.getDetail(order.shipmentId);
  }

  const shipment = await client.shipments.createByAddressIds(buildRequest(order));

  await orderRepository.update(orderId, { shipmentId: shipment.id });
  return shipment;
}
```

> **TIP:** 
See [Tracking Utilities](reference/tracking.md) for barcode resolution helpers and [Migration Guide](reference/migration.md) for legacy tracking API changes.
