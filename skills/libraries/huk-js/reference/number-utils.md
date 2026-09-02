# Number Utilities

The `number` module provides 28 methods for validation, mathematical operations, statistics, and locale-aware formatting.

```typescript
import { number } from '@vorlaxen-labs/huk-js';
import { clamp, format, isBetween } from '@vorlaxen-labs/huk-js/number';
```

---

## Validation

### Type Checks

| Method | Description |
|---|---|
| `isNumber(value)` | Number type (includes `Infinity`; use `isFinite` to reject non-finite) |
| `isInteger(value)` | Whole number |
| `isFloat(value)` | Has decimal component |
| `isFinite(value)` | Finite number type guard |
| `isSafeInteger(value)` | Within `Number.MAX_SAFE_INTEGER` range |

```typescript
number.isNumber(42);
number.isNumber(NaN);
number.isNumber('42');

number.isInteger(5);
number.isInteger(5.5);

number.isSafeInteger(9007199254740991);
```

### Sign Classification

| Method | Example |
|---|---|
| `isPositive(5)` | `true` |
| `isNegative(-3)` | `true` |
| `isZero(0)` | `true` |

### Range & Divisibility

**`isBetween(value, min, max, inclusive?)`**

| Parameter | Default |
|---|---|
| `inclusive` | `true` |

```typescript
number.isBetween(5, 1, 10);
number.isBetween(1, 1, 10);
number.isBetween(1, 1, 10, false);
number.isBetween(11, 1, 10);
```

**`isMultipleOf(value, factor)`** — returns `false` when `factor` is `0`.

```typescript
number.isMultipleOf(12, 4);
number.isMultipleOf(7, 3);
number.isMultipleOf(10, 0);
```

---

## Mathematical Operations

### `clamp(value, min, max)`

```typescript
number.clamp(5, 1, 10);
number.clamp(-99, 1, 10);
number.clamp(99, 1, 10);
```

Use for pagination limits, percentage bounds, rating scores.

### Rounding

| Method | Description |
|---|---|
| `round(value, decimals?)` | Standard rounding |
| `floor(value, decimals?)` | Round down |
| `ceil(value, decimals?)` | Round up |
| `toFixed(value, decimals)` | Fixed decimal places as number |

```typescript
number.round(3.14159, 2);
number.floor(3.99, 0);
number.ceil(3.01, 0);
number.toFixed(3.14159, 2);
```

### Interpolation & Normalization

**`lerp(start, end, t)`** — linear interpolation, `t` between 0 and 1.

```typescript
number.lerp(0, 100, 0.5);
number.lerp(0, 100, 0);
number.lerp(0, 100, 1);
```

**`normalize(value, min, max)`** — maps value to `[0, 1]`. Returns `0` when `min === max`.

```typescript
number.normalize(50, 0, 100);
number.normalize(5, 5, 5);
```

### Basic Math

```typescript
number.abs(-42);
number.sum(1, 2, 3, 4, 5);
number.average(1, 2, 3, 4, 5);
number.median(1, 3, 2);
number.median(1, 2, 3, 4);
number.percentage(25, 200);
number.percentage(10, 0);
```

---

## Formatting

### `format(value, options?)`

| Option | Type | Description |
|---|---|---|
| `locale` | `string` | BCP 47 locale |
| `decimals` | `number` | Decimal places |
| `notation` | `'standard' \| 'scientific' \| 'engineering' \| 'compact'` | Notation style |

```typescript
number.format(1234567);
number.format(3.14159, { decimals: 2 });
number.format(1500000, { notation: 'compact', locale: 'en-US' });
```

### `currency(value, options?)`

| Option | Default | Description |
|---|---|---|
| `currency` | `'USD'` | ISO 4217 code |
| `locale` | `'en-US'` | BCP 47 locale |
| `decimals` | `2` | Decimal places |

```typescript
number.currency(1234.5);
number.currency(1000, { currency: 'EUR', locale: 'de-DE' });
number.currency(999.99, { currency: 'TRY', locale: 'tr-TR' });
```

### Display Helpers

```typescript
number.compact(1200);
number.compact(1500000);
number.compact(1500000, 'tr-TR');

number.bytes(0);
number.bytes(1024);
number.bytes(1048576);
number.bytes(1073741824, 2);

number.ordinal(1);
number.ordinal(2);
number.ordinal(3);
number.ordinal(11);
number.ordinal(21);

number.pad(5, 3);
number.pad(42, 5);
number.pad(1000, 3);
```

---

## Pagination Helper Pattern

```typescript
import { number } from '@vorlaxen-labs/huk-js';

export function parsePage(raw: unknown, defaultPage = 1): number {
  const parsed = Number(raw);
  return number.isInteger(parsed) && number.isPositive(parsed) ? parsed : defaultPage;
}

export function parseLimit(raw: unknown, defaultLimit = 20, max = 100): number {
  const parsed = Number(raw);
  if (!number.isInteger(parsed) || !number.isPositive(parsed)) return defaultLimit;
  return number.clamp(parsed, 1, max);
}
```

---

## Method Reference

| Category | Methods |
|---|---|
| Validation | `isNumber`, `isInteger`, `isFloat`, `isFinite`, `isSafeInteger`, `isPositive`, `isNegative`, `isZero`, `isBetween`, `isMultipleOf` |
| Math | `clamp`, `round`, `floor`, `ceil`, `lerp`, `normalize`, `toFixed`, `abs` |
| Statistics | `sum`, `average`, `median`, `percentage` |
| Formatting | `format`, `currency`, `compact`, `bytes`, `ordinal`, `pad` |

---

## Common Patterns

### Price Display

```typescript
const price = number.currency(product.price, {
  currency: 'TRY',
  locale: 'tr-TR',
});
```

### Dashboard Stats

```typescript
const stats = {
  total: number.format(totalUsers),
  growth: number.percentage(newUsers, totalUsers, 1) + '%',
  storage: number.bytes(diskUsed),
};
```

### Score Normalization

```typescript
const normalizedScore = number.normalize(rawScore, 0, maxScore);
const displayPercent = number.round(normalizedScore * 100, 1);
```

> **TIP:**
