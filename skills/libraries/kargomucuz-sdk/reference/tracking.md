# Tracking Utilities

Public tracking helpers exported from `@vorlaxen-labs/kargomucuz-sdk`. Use these when building custom tracking UIs or processing raw shipment payloads.

```typescript
import {
  isKargomucuzPanelBarcode,
  findKpBarcodeInPayload,
  resolveTrackingBarcode,
  resolveTrackingUrl,
  extractHandlerTrackingLink,
  type TrackingBarcodeResolution,
  type RawShipmentDetail,
} from '@vorlaxen-labs/kargomucuz-sdk';
```

For most integrations, prefer `client.shipments.resolveTracking()` which orchestrates these utilities with polling. See [Shipments](reference/shipments.md).

---

## KP Barcode Format

Kargomucuz Panel (KP) barcodes follow the pattern `KP` followed by digits:

```
/^KP\d+$/i
```

Examples: `KP06496651733`, `kp12345678901`

KP barcodes are PTT-queryable via:

```
https://gonderitakip.ptt.gov.tr/Track/Verify?q={barcode}
```

---

## `isKargomucuzPanelBarcode(value)`

Returns `true` if the value matches the KP barcode format.

```typescript
isKargomucuzPanelBarcode('KP06496651733');  // true
isKargomucuzPanelBarcode('2995045154518');  // false
```

---

## `findKpBarcodeInPayload(payload)`

Recursively searches nested objects and arrays for a KP-format barcode. Returns `undefined` if none found.

```typescript
const raw = await client.shipments.getDetailRaw(shipmentId);
const kpBarcode = findKpBarcodeInPayload(raw);
```

---

## `resolveTrackingBarcode(detail, convertedReference?)`

Extracts the best tracking barcode from a raw shipment detail object.

**Returns:** `TrackingBarcodeResolution`

```typescript
interface TrackingBarcodeResolution {
  referenceCode: string;
  agreementNumber?: string;
  trackingBarcode: string;
  handlerTrackingLink?: string;
  isPttQueryable: boolean;
}
```

**Second parameter:** optional `string` (converted reference ID from `convertShipmentId()` — e.g. `converted?.kargopaneliId ?? converted?.referenceId`), not a `ConvertShipmentResult` object.

**Resolution priority:**

1. `agreementNumber` from shipment info
2. Deep KP search via `findKpBarcodeInPayload(detail)`
3. `convertedReference` if it matches KP format
4. Barcode extracted from `handlerTrackingLink` URL
5. `barcode` field from shipment info
6. `referenceCode` if KP-format
7. `labelBarcode` fallback

```typescript
const raw = await client.shipments.getDetailRaw(shipmentId);
const converted = await client.shipments.convertShipmentId(shipmentId);

const resolved = resolveTrackingBarcode(
  raw,
  converted?.kargopaneliId ?? converted?.referenceId,
);

console.log(resolved.trackingBarcode);
console.log(resolved.isPttQueryable);
```

---

## `resolveTrackingUrl(detail, barcode, urlTemplate?)`

Generates a tracking URL from shipment detail and barcode. Returns `undefined` when no URL can be resolved.

1. Returns `handlerTrackingLink` if present in the detail
2. Falls back to PTT URL template for KP barcodes
3. Accepts a custom `urlTemplate` for other carriers

```typescript
const resolved = resolveTrackingBarcode(raw);
const url = resolveTrackingUrl(raw, resolved.trackingBarcode);

const customUrl = resolveTrackingUrl(
  raw,
  resolved.trackingBarcode,
  'https://tracking.example.com/{barcode}',
);
```

Default PTT template: `https://gonderitakip.ptt.gov.tr/Track/Verify?q={barcode}`

---

## `extractHandlerTrackingLink(detail)`

Extracts the carrier handler tracking link from a raw shipment detail payload. Returns `undefined` if absent.

```typescript
const raw = await client.shipments.getDetailRaw(shipmentId);
const link = extractHandlerTrackingLink(raw);
```

---

## Barcode Field Reference

| Field | Example | PTT Queryable |
|---|---|---|
| `referenceCode` | `2995045154518` | No (numeric reference) |
| `agreementNumber` | `KP06496651733` | Yes |
| `trackingBarcode` | Best available | Depends on format |
| `handlerTrackingLink` | Carrier URL | Via carrier site |

---

## Usage Pattern

```typescript
import {
  Kargomucuz,
  resolveTrackingBarcode,
  resolveTrackingUrl,
  isKargomucuzPanelBarcode,
} from '@vorlaxen-labs/kargomucuz-sdk';

const client = new Kargomucuz({ auth: { apiKey } });
const raw = await client.shipments.getDetailRaw(shipmentId);

const resolved = resolveTrackingBarcode(raw);
const trackingUrl = resolveTrackingUrl(raw, resolved.trackingBarcode);

return {
  barcode: resolved.trackingBarcode,
  trackingUrl,
  isPttQueryable: resolved.isPttQueryable,
};
```

> **TIP:** See [Shipments](reference/shipments.md) for `resolveTracking()` and `track()` and [Migration Guide](reference/migration.md) for legacy tracking API changes.
