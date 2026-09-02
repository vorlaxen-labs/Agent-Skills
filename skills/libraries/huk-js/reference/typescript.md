# TypeScript Guide

HuK is written in strict TypeScript with accurate type signatures, type guards, and generic module exports.

---

## Main Export

```typescript
import { HuK } from '@vorlaxen-labs/huk-js';
```

`HuK` is a singleton instance of `HuKs` with readonly namespace properties:

```typescript
HuK.string.slugify('hello');
HuK.number.isNumber(42);
HuK.is.string(value);
HuK.fn.debounce(fn, 300);
```

---

## Named Module Exports

```typescript
import {
  string,
  number,
  date,
  array,
  object,
  fn,
  crypto,
  storage,
} from '@vorlaxen-labs/huk-js';
```

Each export is typed:

```typescript
type StringModule = typeof string;
type NumberModule = typeof number;
type ObjectModule = typeof object;
type ArrayModule = typeof array;
type DateModule = typeof date;
type FnModule = typeof fn;
type CryptoModule = typeof crypto;
type StorageModule = typeof storage;
```

---

## Sub-Path Imports

Each sub-path has its own type definition file:

```typescript
import { string } from '@vorlaxen-labs/huk-js/string';
import { slugify, isEmail } from '@vorlaxen-labs/huk-js/string';
import { get, pick } from '@vorlaxen-labs/huk-js/object';
import { debounce } from '@vorlaxen-labs/huk-js/fn';
```

Configured via `package.json` `exports` and `typesVersions` — IDE autocomplete works for all paths.

---

## Type Guards

`HuK.is.*` methods are proper TypeScript type predicates:

```typescript
function processQuery(raw: unknown) {
  if (HuK.is.string(raw)) {
    raw.trim();
  }

  if (HuK.is.number(raw)) {
    HuK.number.clamp(raw, 0, 100);
  }

  if (HuK.is.array(raw)) {
    raw.map(String);
  }
}
```

Number validators also narrow types:

```typescript
function validateAge(raw: unknown): raw is number {
  return HuK.number.isNumber(raw)
    && HuK.number.isInteger(raw)
    && HuK.number.isBetween(raw, 0, 150);
}
```

---

## Generic Storage

```typescript
interface SessionData {
  userId: string;
  role: 'user' | 'admin';
  expiresAt: Date;
}

storage.set<SessionData>('session:abc', {
  userId: 'usr_1',
  role: 'admin',
  expiresAt: new Date(),
});

const session = storage.get<SessionData>('session:abc');

if (session) {
  session.userId;
}
```

---

## Typed `object.pick`

Return type is inferred as `Pick<T, K>`:

```typescript
interface User {
  id: string;
  email: string;
  password: string;
  role: string;
}

const publicUser = object.pick(user, ['id', 'email']);
```

---

## Format Options Types

```typescript
import type { FormatOptions, CurrencyOptions } from '@vorlaxen-labs/huk-js/number';
import type { DateFormatOptions } from '@vorlaxen-labs/huk-js/date';

const priceOpts: CurrencyOptions = { currency: 'TRY', locale: 'tr-TR' };
const dateOpts: DateFormatOptions = { dateStyle: 'long', locale: 'tr-TR' };
```

---

## Function Utility Generics

`debounce`, `throttle`, `once`, and `memoize` preserve function signatures:

```typescript
function search(query: string, limit: number): void {
  console.log(query, limit);
}

const debouncedSearch = fn.debounce(search, 300);
debouncedSearch('hello', 10);
```

`retry` preserves async return types:

```typescript
async function fetchUser(id: string): Promise<User> {
  return api.get(`/users/${id}`);
}

const result: User = await fn.retry(() => fetchUser('abc'), 3, 1000);
```

---

## ESM / CJS

```typescript
import { string } from '@vorlaxen-labs/huk-js';
```

```javascript
const { string } = require('@vorlaxen-labs/huk-js');
```

Types resolve automatically — no `@types/` package.

---

## Strict Mode

HuK is designed for `strict: true`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

`object.get` returns `any` by design — narrow with type guards:

```typescript
const raw = object.get(query, 'search');

if (HuK.is.string(raw)) {
  const term: string = raw.trim();
}
```

---

## Common Type Errors

### Cannot find module sub-path

Ensure your `moduleResolution` is `bundler` or `node16`:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

### `HuK.is` not available from sub-path string import

`HuK.is` is only on the main export. Import from main or `@vorlaxen-labs/huk-js/is`:

```typescript
import { HuK } from '@vorlaxen-labs/huk-js';
import { is } from '@vorlaxen-labs/huk-js/is';
```

### `string.isEmpty(null)` type error

`isEmpty` accepts `string | null | undefined` — this is intentional.

---

## Testing with HuK

HuK functions are pure and easy to test without mocks:

```typescript
import { string, number, object } from '@vorlaxen-labs/huk-js';

describe('string.slugify', () => {
  it('handles Turkish characters', () => {
    expect(string.slugify('çalışma')).toBe('calisma');
  });
});

describe('object.get', () => {
  it('returns default for missing path', () => {
    expect(object.get({}, 'a.b.c', 'fallback')).toBe('fallback');
  });
});
```

> **TIP:**
