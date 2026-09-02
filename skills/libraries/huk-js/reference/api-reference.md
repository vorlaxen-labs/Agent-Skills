# API Reference

Complete reference for `@vorlaxen-labs/huk-js` v1.0.0.

---

## Main Export

```typescript
import { HuK } from '@vorlaxen-labs/huk-js';
```

`HuK` — singleton with readonly namespaces: `string`, `number`, `date`, `array`, `object`, `is`, `storage`, `fn`, `crypto`.

---

## Named Module Exports

```typescript
import {
  string, number, date, array, object, fn, crypto, storage,
  StringModule, NumberModule, DateModule, ArrayModule,
  ObjectModule, FnModule, CryptoModule, StorageModule,
} from '@vorlaxen-labs/huk-js';
```

---

## String Module (`HuK.string` / `string`)

| Method | Signature | Returns |
|---|---|---|
| `slugify` | `(text: string) => string` | URL-safe slug |
| `truncate` | `(text, limit?, suffix?) => string` | Truncated string |
| `truncateWords` | `(text, limit?, suffix?) => string` | Char-limit truncated at last word boundary |
| `toPascalCase` | `(text: string) => string` | PascalCase |
| `toCamelCase` | `(text: string) => string` | camelCase |
| `toTitleCase` | `(text: string) => string` | Title Case |
| `toSentenceCase` | `(text: string) => string` | Sentence case |
| `removeWhitespace` | `(text: string) => string` | No whitespace |
| `removeNumbers` | `(text: string) => string` | No digits |
| `reverse` | `(text: string) => string` | Reversed |
| `interpolate` | `(template, values) => string` | Interpolated |
| `mask` | `(value, options?) => string` | Masked string |
| `secureRandom` | `(length?) => string` | Secure hex string |
| `escapeHtml` | `(text: string) => string` | HTML-escaped |
| `isEmail` | `(value: string) => boolean` | Email format check |
| `isStrongPassword` | `(value: string) => boolean` | Password strength |
| `isEmpty` | `(value: string \| null \| undefined) => boolean` | Empty check |

Named exports: `slugify`, `truncate`, `truncateWords`, `toPascalCase`, `toCamelCase`, `toTitleCase`, `toSentenceCase`, `removeWhitespace`, `removeNumbers`, `reverse`, `mask`, `secureRandom`, `escapeHtml`, `isEmail`, `isStrongPassword`, `isEmpty`, `interpolate`.

---

## Number Module (`HuK.number` / `number`)

| Method | Signature |
|---|---|
| `isNumber` | `(value: unknown) => value is number` |
| `isInteger` | `(value: unknown) => value is number` |
| `isFloat` | `(value: unknown) => value is number` |
| `isFinite` | `(value: unknown) => value is number` |
| `isSafeInteger` | `(value: unknown) => value is number` |
| `isPositive` | `(value: number) => boolean` |
| `isNegative` | `(value: number) => boolean` |
| `isZero` | `(value: number) => boolean` |
| `isBetween` | `(value, min, max, inclusive?) => boolean` |
| `isMultipleOf` | `(value, factor) => boolean` |
| `clamp` | `(value, min, max) => number` |
| `round` | `(value, decimals?) => number` |
| `floor` | `(value, decimals?) => number` |
| `ceil` | `(value, decimals?) => number` |
| `lerp` | `(start, end, t) => number` |
| `normalize` | `(value, min, max) => number` |
| `toFixed` | `(value, decimals) => number` |
| `abs` | `(value: number) => number` |
| `sum` | `(...values: number[]) => number` |
| `average` | `(...values: number[]) => number` |
| `median` | `(...values: number[]) => number` |
| `percentage` | `(value, total, decimals?) => number` |
| `format` | `(value, options?: FormatOptions) => string` |
| `currency` | `(value, options?: CurrencyOptions) => string` |
| `compact` | `(value, locale?) => string` |
| `bytes` | `(value, decimals?) => string` |
| `ordinal` | `(value, locale?) => string` |
| `pad` | `(value, length, char?) => string` |

---

## Date Module (`HuK.date` / `date`)

| Method | Signature |
|---|---|
| `format` | `(date, options?: DateFormatOptions) => string` |
| `toISODate` | `(date: Date) => string` |
| `relative` | `(date, locale?) => string` |
| `part` | `(date, part, locale?) => string` |
| `add` | `(date, amount, unit) => Date` |
| `subtract` | `(date, amount, unit) => Date` |
| `startOf` | `(date, unit) => Date` |
| `isValid` | `(date: Date) => boolean` |
| `isLeapYear` | `(year: number) => boolean` |
| `isBefore` | `(d1, d2) => boolean` |
| `isAfter` | `(d1, d2) => boolean` |
| `isSameDay` | `(d1, d2) => boolean` |
| `isWeekend` | `(d: Date) => boolean` |
| `isToday` | `(d: Date) => boolean` |

Units: `'day' | 'month' | 'year'`

---

## Array Module (`HuK.array` / `array`)

| Method | Signature |
|---|---|
| `first` | `<T>(arr: T[]) => T \| undefined` |
| `last` | `<T>(arr: T[]) => T \| undefined` |
| `compact` | `<T>(arr: T[]) => T[]` |
| `unique` | `<T>(arr: T[]) => T[]` |
| `flatten` | `<T>(arr: any[]) => T[]` |
| `shuffle` | `<T>(arr: T[]) => T[]` |
| `groupBy` | `<T, K>(arr, fn) => Record<K, T[]>` |

---

## Object Module (`HuK.object` / `object`)

| Method | Signature |
|---|---|
| `get` | `(obj, path, defaultValue?) => any` |
| `pick` | `<T, K>(obj: T, keys: K[]) => Pick<T, K>` |
| `clone` | `<T>(obj: T) => T` |
| `merge` | `<T>(target: T, source: Partial<T>) => T` |

---

## Is Module (`HuK.is`)

| Method | Signature |
|---|---|
| `string` | `(val: unknown) => val is string` |
| `number` | `(val: unknown) => val is number` |
| `boolean` | `(val: unknown) => val is boolean` |
| `array` | `(val: unknown) => val is any[]` |
| `object` | `(val: unknown) => val is Record<string, any>` |
| `empty` | `(val: unknown) => boolean` |

---

## Function Module (`HuK.fn` / `fn`)

| Method | Signature |
|---|---|
| `debounce` | `<T>(fn: T, delay: number) => (...args) => void` |
| `throttle` | `<T>(fn: T, limit: number) => (...args) => void` |
| `sleep` | `(ms: number) => Promise<void>` |
| `pipe` | `<T>(...fns) => (value: T) => T` |
| `compose` | `<T>(...fns) => (value: T) => T` |
| `once` | `<T>(fn: T) => (...args) => ReturnType<T>` |
| `memoize` | `<T>(fn: T) => (...args) => ReturnType<T>` |
| `retry` | `<T>(fn: () => Promise<T>, attempts?, delayMs?) => Promise<T>` |

---

## Crypto Module (`HuK.crypto` / `crypto`)

| Method | Signature |
|---|---|
| `generateUuid` | `() => string` |
| `toBase64` | `(data: string) => string` |
| `fromBase64` | `(data: string) => string` |
| `hash` | `(data: string, salt?) => Promise<string>` |
| `validate.isUuid` | `(value: string) => boolean` |
| `validate.isSha256` | `(value: string) => boolean` |
| `validate.isBase64` | `(value: string) => boolean` |
| `validate.isStrongSalt` | `(salt, minLength?) => boolean` |

---

## Storage Module (`HuK.storage` / `storage`)

| Method | Signature |
|---|---|
| `set` | `<T>(key: string, value: T) => void` |
| `get` | `<T>(key: string, defaultValue?: T \| null) => T \| null` |
| `remove` | `(key: string) => void` |
| `clear` | `() => void` |

---

## Sub-Path Imports

| Path | Export |
|---|---|
| `@vorlaxen-labs/huk-js` | `HuK` + all modules |
| `@vorlaxen-labs/huk-js/string` | `string`, named string fns |
| `@vorlaxen-labs/huk-js/number` | `number`, named number fns |
| `@vorlaxen-labs/huk-js/date` | `date`, named date fns |
| `@vorlaxen-labs/huk-js/array` | `array`, named array fns |
| `@vorlaxen-labs/huk-js/object` | `object`, named object fns |
| `@vorlaxen-labs/huk-js/is` | `is` type guards |
| `@vorlaxen-labs/huk-js/fn` | `fn`, named fn utilities |
| `@vorlaxen-labs/huk-js/crypto` | `crypto` |
| `@vorlaxen-labs/huk-js/storage` | `storage` |

---

## Package Info

| Property | Value |
|---|---|
| Package | `@vorlaxen-labs/huk-js` |
| Version | `1.0.0` |
| License | MIT |
| Runtime deps | None (Node `crypto` built-in) |
| Peer deps | `express ^4 \|\| ^5` (optional) |
| Formats | ESM + CJS |
| Tree-shakeable | Yes |

---

## Install

```bash
pnpm add @vorlaxen-labs/huk-js
npm install @vorlaxen-labs/huk-js
yarn add @vorlaxen-labs/huk-js
```
