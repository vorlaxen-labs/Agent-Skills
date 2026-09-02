# Rates

The `rates` service provides shipping price quotes before creating a shipment. Query by carrier service code and package weight/desi.

```typescript
const rate = await km.rates.get({ serviceCode, weightOrDesi });
```

---

## `get(params)`

Calculates the shipping cost for a given carrier and package weight.

### Parameters

```typescript
interface RateQueryOptions {
  serviceCode: string;
  weightOrDesi: string | number;
}
```

| Field | Type | Description |
|---|---|---|
| `serviceCode` | `string` | Carrier service code — use `ProviderServiceCode` enum |
| `weightOrDesi` | `string \| number` | Billable weight in kg or desi value |

### Response

```typescript
interface RateResult {
  amount: number;
  currency: string;
  providerCode: string;
}
```

| Field | Description |
|---|---|
| `amount` | Quoted price as a number |
| `currency` | ISO currency code (uppercase, e.g. `"TRY"`) |
| `providerCode` | Echo of the requested service code |

**Endpoint:** `GET /v1/shipments/desi-or-kgs`

Query params sent to API:
- `providerServiceCode`
- `desiOrKg`

---

## Basic Usage

```typescript
import { Kargomucuz, ProviderServiceCode } from '@vorlaxen-labs/kargomucuz-sdk';

const km = new Kargomucuz({
  auth: { apiKey: process.env.KARGOMUCUZ_API_KEY! },
});

const rate = await km.rates.get({
  serviceCode: ProviderServiceCode.YURTICI_STANDART_2,
  weightOrDesi: 5,
});

console.log(`${rate.amount} ${rate.currency}`);
```

---

## Compare All Carriers

```typescript
import { ProviderServiceCode } from '@vorlaxen-labs/kargomucuz-sdk';

const ALL_CARRIERS = Object.values(ProviderServiceCode);

async function compareRates(weightOrDesi: number) {
  const results = await Promise.allSettled(
    ALL_CARRIERS.map(serviceCode =>
      km.rates.get({ serviceCode, weightOrDesi }),
    ),
  );

  return results
    .filter((r): r is PromiseFulfilledResult<RateResult> => r.status === 'fulfilled')
    .map(r => r.value)
    .sort((a, b) => a.amount - b.amount);
}
```

---

## Billable Weight Calculation

Carriers charge based on the higher of actual weight or desi (dimensional weight):

```typescript
function calculateDesi(w: number, h: number, d: number): number {
  return (w * h * d) / 3000;
}

function getBillableWeight(
  weightKg: number,
  widthCm: number,
  heightCm: number,
  depthCm: number,
): number {
  return Math.max(weightKg, calculateDesi(widthCm, heightCm, depthCm));
}

const weight = getBillableWeight(2.5, 30, 20, 15);

const rate = await km.rates.get({
  serviceCode: ProviderServiceCode.HEPSIJET_STANDART_2,
  weightOrDesi: Math.ceil(weight),
});
```

Always round up desi/kg to avoid under-quoting.

---

## Checkout Integration Pattern

```typescript
interface ShippingOption {
  carrier: string;
  serviceCode: ProviderServiceCode;
  price: number;
  currency: string;
}

async function getShippingOptions(
  weightOrDesi: number,
): Promise<ShippingOption[]> {
  const carriers = [
    ProviderServiceCode.YURTICI_STANDART_2,
    ProviderServiceCode.HEPSIJET_STANDART_2,
    ProviderServiceCode.SURAT_STANDART_2,
  ];

  const quotes = await Promise.allSettled(
    carriers.map(async serviceCode => {
      const rate = await km.rates.get({ serviceCode, weightOrDesi });
      return {
        carrier: serviceCode,
        serviceCode,
        price: rate.amount,
        currency: rate.currency,
      };
    }),
  );

  return quotes
    .filter((q): q is PromiseFulfilledResult<ShippingOption> => q.status === 'fulfilled')
    .map(q => q.value);
}
```

Return options to the front-end for customer selection. Store the selected `serviceCode` in the order for shipment creation after payment.

---

## Caching Quotes

Rate quotes are valid for a short window. Cache aggressively during checkout:

```typescript
const quoteCache = new Map<string, { rate: RateResult; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

async function getCachedRate(serviceCode: string, weightOrDesi: number): Promise<RateResult> {
  const key = `${serviceCode}:${weightOrDesi}`;
  const cached = quoteCache.get(key);

  if (cached && Date.now() < cached.expiresAt) {
    return cached.rate;
  }

  const rate = await km.rates.get({ serviceCode, weightOrDesi });
  quoteCache.set(key, { rate, expiresAt: Date.now() + CACHE_TTL_MS });
  return rate;
}
```

Do not cache across different weight/desi values or carrier codes.

---

## Error Handling

| Error | Cause | Action |
|---|---|---|
| `AuthError` | Invalid API key | Check `KARGOMUCUZ_API_KEY` |
| `APIError` | Carrier not enabled, invalid service code | Exclude carrier from options |
| `APIError('Pricing data not found...')` | No pricing for weight/carrier combo | Try different weight or carrier |

```typescript
try {
  const rate = await km.rates.get({ serviceCode, weightOrDesi });
  return rate;
} catch (error) {
  if (error instanceof APIError) {
    logger.warn({ serviceCode, weightOrDesi, error: error.message }, 'Rate quote failed');
    return null;
  }
  throw error;
}
```

---

## Rate vs Shipment Price

The rate quote is an **estimate** at query time. The final charge is determined at shipment creation based on the actual package data submitted in `ShipmentPackageInfo`. Ensure package dimensions and weight in the shipment match what was quoted.

See [Providers & Enums](reference/providers.md) for all carrier codes and [Shipments](reference/shipments.md) for creating the shipment after quote selection.

> **TIP:**
