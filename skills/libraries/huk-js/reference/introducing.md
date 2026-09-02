# HuK (Helper Utility Kit)

**Smart helpers for modern TypeScript environments. Small footprint, massive utility.**

`@vorlaxen-labs/huk-js` is a zero-dependency, tree-shakeable utility library that replaces scattered `utils/` folders with a single, type-safe source of truth — organized into nine focused namespaces.

---

## The Problem HuK Solves

Every backend project eventually accumulates the same problems:

- A `utils/` folder with 40 copy-pasted helpers nobody trusts
- Three different `slugify` implementations across services
- Validation logic duplicated in controllers, services, and DTOs
- No tree-shaking — importing one helper pulls in the entire utils bundle
- Type guards written as loose `typeof` checks with no narrowing

HuK consolidates these into **one predictable API** with sub-path imports, named exports, and strict TypeScript signatures.

---

## Features

- **9 Focused Modules:** `string`, `number`, `date`, `array`, `object`, `is`, `storage`, `fn`, `crypto`
- **Three Import Styles:** `HuK.*` namespace, named exports, sub-path imports
- **Tree-Shakeable:** Import only `@vorlaxen-labs/huk-js/string` — nothing else ships
- **Zero Runtime Dependencies:** Pure TypeScript + Node built-in `crypto`
- **Turkish-Aware:** `slugify` handles `ç`, `ğ`, `ı`, `ö`, `ş`, `ü` natively
- **Security Built-In:** PII masking, HTML escaping, secure random, SHA-256 hashing
- **BaR-Ready:** Pairs naturally with `@vorlaxen-labs/bar-js` in Vorlaxen backends

---

## Quick Example

```typescript
import { HuK } from '@vorlaxen-labs/huk-js';

HuK.string.slugify('Merhaba Dünya!');
HuK.string.mask('4444555566667777', { visibleEnd: 4 });
HuK.string.isEmail('user@example.com');
HuK.number.clamp(99, 1, 10);
HuK.object.get(user, 'profile.name', 'Anonymous');
HuK.array.groupBy(orders, o => o.status);
HuK.is.string(searchQuery);
```

---

## Module Overview

| Module | Access | Methods | Primary Use |
|---|---|---|---|
| String | `HuK.string` / `string` | 16 | Slugify, mask, validate, transform |
| Number | `HuK.number` / `number` | 28 | Math, format, statistics, validation |
| Date | `HuK.date` / `date` | 14 | Format, compare, manipulate |
| Array | `HuK.array` / `array` | 7 | groupBy, unique, flatten, shuffle |
| Object | `HuK.object` / `object` | 4 | get, pick, clone, merge |
| Is | `HuK.is` | 6 | Runtime type guards |
| Fn | `HuK.fn` / `fn` | 8 | debounce, throttle, memoize, retry, sleep, pipe, compose, once |
| Crypto | `HuK.crypto` / `crypto` | 8 | UUID, hash, base64, validate.* |
| Storage | `HuK.storage` | 4 | Browser `localStorage` wrapper |

---

## Documentation Map

| Section | What you'll learn |
|---|---|
| [Getting Started](reference/getting-started.md) | Installation, first imports, module selection |
| [Import Strategies](reference/import-strategies.md) | Namespace vs named vs sub-path imports |
| [Type Guards](reference/is-type-guards.md) | Runtime type checking with `HuK.is` |
| [String Utilities](reference/string-utils.md) | Slugify, mask, validation, case transforms |
| [Number Utilities](reference/number-utils.md) | Clamp, format, statistics, validation |
| [Object Utilities](reference/object-utils.md) | Path access, pick, clone, merge |
| [Array Utilities](reference/array-utils.md) | groupBy, unique, flatten, shuffle |
| [Date Utilities](reference/date-utils.md) | Format, relative time, manipulation |
| [Crypto Utilities](reference/crypto-utils.md) | UUID, hash, base64, validation |
| [Function Utilities](reference/function-utils.md) | debounce, throttle, memoize, retry |
| [Storage Utilities](reference/storage-utils.md) | Browser localStorage patterns |
| [TypeScript Guide](reference/typescript.md) | Type narrowing, module types, exports |
| [Recipes & Patterns](reference/recipes.md) | Real-world backend patterns |
| [API Reference](reference/api-reference.md) | Complete method listing |

---

## When to Use HuK

HuK is the right choice when:

- You want to delete your project's ad-hoc `utils/` folder
- You need Turkish-aware slug generation
- You want tree-shakeable imports per module
- You build Node.js / Express backends with TypeScript

HuK is **not** the right choice when:

- You need a full validation framework (use Zod, Yup, or class-validator)
- You need a date library with timezone support (use date-fns, Luxon, or Temporal)
- You need lodash's entire surface area (HuK is intentionally focused)

---

## License

Distributed under the MIT License.

> **INFO:**
