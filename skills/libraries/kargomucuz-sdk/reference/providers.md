# Providers & Enums

Reference for carrier service codes and currency values used in rate queries and shipment creation.

---

## ProviderServiceCode

Enum of supported carrier service codes. Always use the enum — never raw strings — for type safety and IDE autocomplete.

```typescript
import { ProviderServiceCode } from '@vorlaxen-labs/kargomucuz-sdk';
```

### All Values

| Enum | API Value | Carrier |
|---|---|---|
| `ProviderServiceCode.PTT_FIXED_PRICE` | `ptt_fixed_price` | PTT Fixed Price |
| `ProviderServiceCode.PTT_STANDART_2` | `ptt_standart_2` | PTT Standard |
| `ProviderServiceCode.HEPSIJET_STANDART_2` | `hepsijet_standart_2` | Hepsijet Standard |
| `ProviderServiceCode.SURAT_STANDART_2` | `surat_standart_2` | Sürat Standard |
| `ProviderServiceCode.UPS_STANDART_2` | `ups_standart_2` | UPS Standard |
| `ProviderServiceCode.KOLAYGELSIN_STANDART_2` | `kolaygelsin_standart_2` | KolayGelsin Standard |
| `ProviderServiceCode.YURTICI_STANDART_2` | `yurtici_standart_2` | Yurtiçi Standard |

### Usage in Rate Queries

```typescript
const rate = await km.rates.get({
  serviceCode: ProviderServiceCode.HEPSIJET_STANDART_2,
  weightOrDesi: 3,
});
```

### Usage in Shipment Creation

```typescript
const shipment = await km.shipments.create({
  sender,
  receiver,
  providerServiceCode: ProviderServiceCode.YURTICI_STANDART_2,
  packageInfo: { ... },
});
```

---

## Carrier Selection Strategy

Query all carriers in parallel and select by price or SLA:

```typescript
import { ProviderServiceCode } from '@vorlaxen-labs/kargomucuz-sdk';

const CARRIERS = [
  ProviderServiceCode.YURTICI_STANDART_2,
  ProviderServiceCode.HEPSIJET_STANDART_2,
  ProviderServiceCode.SURAT_STANDART_2,
  ProviderServiceCode.KOLAYGELSIN_STANDART_2,
  ProviderServiceCode.PTT_STANDART_2,
  ProviderServiceCode.UPS_STANDART_2,
] as const;

async function getCheapestRate(weightOrDesi: number) {
  const quotes = await Promise.allSettled(
    CARRIERS.map(serviceCode =>
      km.rates.get({ serviceCode, weightOrDesi })
    ),
  );

  const successful = quotes
    .filter((r): r is PromiseFulfilledResult<RateResult> => r.status === 'fulfilled')
    .map(r => r.value);

  if (successful.length === 0) {
    throw new Error('No carrier returned a valid quote');
  }

  return successful.reduce((min, q) => q.amount < min.amount ? q : min);
}
```

`Promise.allSettled` ensures one carrier failure does not block others.

---

## Currency

```typescript
import { Currency } from '@vorlaxen-labs/kargomucuz-sdk';

enum Currency {
  TRY = 'try',
  USD = 'usd',
  EUR = 'eur',
}
```

Used in `ShipmentPackageInfo.itemsAmountCurrency` when creating shipments:

```typescript
packageInfo: {
  itemsAmountCurrency: Currency.TRY,
  itemsTaxAmount: 180,
  itemsAmount: 1000,
  items: [...],
}
```

Rate results return currency as an uppercase string (e.g. `"TRY"`) regardless of the enum casing.

---

## Listing Providers via SDK

Discover available carriers programmatically:

```typescript
const providers = await client.shipments.getProviders();
const enums = await client.shipments.getProviderEnums();

console.log(enums.providerServiceCode);
```

| Method | Endpoint |
|---|---|
| `getProviders()` | `GET /v1/shipments/providers` |
| `getProviderDetail(id)` | `GET /v1/shipments/providers/{id}` |
| `getProviderEnums()` | `GET /v1/shipments/providers/enums` |

Use `getProviderEnums().providerServiceCode` to dynamically build carrier selection lists instead of hardcoding `ProviderServiceCode` values.

---

## Desi vs Kilogram

The `weightOrDesi` parameter in rate queries accepts either:

- **Desi** (dimensional weight): `(width × height × depth) / 3000` in cm
- **Kilogram**: actual package weight

Use whichever is higher for accurate pricing:

```typescript
function calculateDesi(widthCm: number, heightCm: number, depthCm: number): number {
  return (widthCm * heightCm * depthCm) / 3000;
}

function getBillableWeight(
  weightKg: number,
  widthCm: number,
  heightCm: number,
  depthCm: number,
): number {
  const desi = calculateDesi(widthCm, heightCm, depthCm);
  return Math.max(weightKg, desi);
}

const billable = getBillableWeight(2.5, 30, 20, 15);

const rate = await km.rates.get({
  serviceCode: ProviderServiceCode.SURAT_STANDART_2,
  weightOrDesi: billable,
});
```

Store dimensions as strings in `ShipmentPackageInfo` (`width`, `height`, `depth`, `weight`, `desiOrKg`).

---

## Provider Availability

Not all carriers may be enabled on your Kargomucuz account. If a carrier returns an API error during rate query, exclude it from selection rather than failing the entire checkout flow.

Recommended UX:
1. Query all enabled carriers in parallel
2. Display available options with price and estimated delivery
3. Let the customer or system select one
4. Create shipment with the selected `ProviderServiceCode`

---

## Enum Export Reference

```typescript
import {
  ProviderServiceCode,
  Currency,
} from '@vorlaxen-labs/kargomucuz-sdk';
```

Both are runtime enums — usable as values and types:

```typescript
function isValidProvider(code: string): code is ProviderServiceCode {
  return Object.values(ProviderServiceCode).includes(code as ProviderServiceCode);
}
```

> **TIP:**
