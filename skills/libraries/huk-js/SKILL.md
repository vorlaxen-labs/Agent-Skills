---
name: huk-js
npmPackage: "@vorlaxen-labs/huk-js"
npmVersion: "1.1.2"
description: >-
  Zero-dependency TypeScript utility library (@vorlaxen-labs/huk-js). Nine modules:
  string, number, date, array, object, is, fn, crypto, storage. Tree-shakeable,
  Turkish-aware slugify, PII masking. Use when writing utils, validation, slugify,
  debounce/throttle, type guards, or replacing ad-hoc utils/ folders.
---
# HuK (Helper Utility Kit)

**Package:** `@vorlaxen-labs/huk-js` v1.1.2 · **Zero runtime deps** · **Tree-shakeable**

Nine focused utility namespaces replacing scattered `utils/` folders with a single, type-safe API.

---

## Critical Rules

1. **Prefer named module imports** for backends: `import { string, object } from '@vorlaxen-labs/huk-js'`.
2. **Use sub-path imports** for smallest bundle: `import { string } from '@vorlaxen-labs/huk-js/string'`.
3. **Use `HuK.is.*` type guards** before treating unknown values as typed — never loose `typeof` checks.
4. **HuK is not a validation framework** — use Zod/Yup for schema validation; HuK for lightweight checks.
5. **Never reimplement utilities HuK already provides** — check [reference/api-reference.md](reference/api-reference.md) first.

---

## Import Strategies

```typescript
// 1. Namespace (scripts, prototypes)
import { HuK } from '@vorlaxen-labs/huk-js';
HuK.string.slugify('Merhaba Dünya!');

// 2. Named modules (recommended for backends)
import { string, object, number } from '@vorlaxen-labs/huk-js';
string.slugify('Hello World');
object.get(user, 'profile.name', 'Anonymous');

// 3. Sub-path (smallest bundle)
import { string } from '@vorlaxen-labs/huk-js/string';
```

---

## Module Overview

| Module | Methods | Primary Use |
|---|---|---|
| `string` | 16 | Slugify, mask, validate, case transforms, HTML escape |
| `number` | 28 | Clamp, format, currency, statistics, validation |
| `date` | 14 | Format, relative time, compare, manipulate |
| `array` | 7 | groupBy, unique, flatten, shuffle, compact |
| `object` | 4 | get (path access), pick, clone, merge |
| `is` | 6 | Runtime type guards with narrowing |
| `fn` | 8 | debounce, throttle, memoize, retry, sleep, pipe, compose, once |
| `crypto` | 8 | UUID, SHA-256 hash, base64, validate.* |
| `storage` | 4 | Browser `localStorage` wrapper |

---

## Quick Examples

```typescript
import { string, object, number, HuK } from '@vorlaxen-labs/huk-js';

// Turkish-aware slugify
string.slugify('Merhaba Dünya!');  // 'merhaba-dunya'

// PII masking
string.mask('4444555566667777', { visibleEnd: 4 });

// Input validation
string.isEmail(email);
string.isStrongPassword(password);

// Safe nested access
const page = object.get(req.query, 'page', 1);
const search = object.get(req.query, 'search');

// Type-safe query parsing
const searchQuery = object.get(req.query, 'search');
const searchTerm =
  HuK.is.string(searchQuery) && searchQuery.trim().length > 0
    ? searchQuery.trim()
    : undefined;

// Number formatting
number.currency(1234.5, { currency: 'TRY', locale: 'tr-TR' });
number.clamp(value, 0, 100);

// Array grouping
array.groupBy(orders, o => o.status);

// Async helpers
await fn.retry(() => fetchData(), 3, 1000);
const debouncedSearch = fn.debounce(search, 300);
```

---

## Sub-Path Imports

| Import Path | Module |
|---|---|
| `@vorlaxen-labs/huk-js/string` | String utilities |
| `@vorlaxen-labs/huk-js/number` | Number utilities |
| `@vorlaxen-labs/huk-js/date` | Date utilities |
| `@vorlaxen-labs/huk-js/array` | Array utilities |
| `@vorlaxen-labs/huk-js/object` | Object utilities |
| `@vorlaxen-labs/huk-js/is` | Type guards |
| `@vorlaxen-labs/huk-js/fn` | Function utilities |
| `@vorlaxen-labs/huk-js/crypto` | Crypto utilities |
| `@vorlaxen-labs/huk-js/storage` | Browser localStorage utilities |

---

## HuK + BaR Pattern

```typescript
import { object, string } from '@vorlaxen-labs/huk-js';

app.get('/api/users', async (req, res) => {
  const search = object.get(req.query, 'search', '');
  const sanitized = string.isEmpty(search) ? undefined : search.trim();
  const users = await userService.search(sanitized);
  return res.builder.as.ok(users).build();
});
```

---

## When NOT to Use HuK

- Full schema validation → Zod, Yup, class-validator
- Timezone-aware dates → date-fns, Luxon, Temporal
- Entire lodash surface area → HuK is intentionally focused

---

## Reference Documentation

| Topic | File |
|---|---|
| Installation & first imports | [reference/getting-started.md](reference/getting-started.md) |
| Complete method listing | [reference/api-reference.md](reference/api-reference.md) |
| Import style comparison | [reference/import-strategies.md](reference/import-strategies.md) |
| Type guards (`HuK.is`) | [reference/is-type-guards.md](reference/is-type-guards.md) |
| String utilities | [reference/string-utils.md](reference/string-utils.md) |
| Number utilities | [reference/number-utils.md](reference/number-utils.md) |
| Object utilities | [reference/object-utils.md](reference/object-utils.md) |
| Array utilities | [reference/array-utils.md](reference/array-utils.md) |
| Date utilities | [reference/date-utils.md](reference/date-utils.md) |
| Crypto utilities | [reference/crypto-utils.md](reference/crypto-utils.md) |
| Function utilities | [reference/function-utils.md](reference/function-utils.md) |
| Storage utilities | [reference/storage-utils.md](reference/storage-utils.md) |
| Production patterns | [reference/recipes.md](reference/recipes.md) |
| TypeScript types | [reference/typescript.md](reference/typescript.md) |
