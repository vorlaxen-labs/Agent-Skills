# Getting Started

This guide covers installation, choosing an import style, and using HuK in your first backend module.

---

## Installation

```bash
pnpm add @vorlaxen-labs/huk-js
```

No peer dependencies required for core usage. The `express` peer listed in package.json is optional and only relevant for Express-specific integrations.

---

## Choose Your Import Style

HuK supports three import patterns. Pick based on your bundle size needs:

### 1. Namespace (exploration & prototypes)

```typescript
import { HuK } from '@vorlaxen-labs/huk-js';

const slug = HuK.string.slugify('Hello World');
const safe = HuK.number.clamp(value, 0, 100);
```

Best for: scripts, REPL exploration, small services where bundle size is not critical.

### 2. Named Module Exports (recommended for backends)

```typescript
import { string, object, number } from '@vorlaxen-labs/huk-js';

const slug = string.slugify('Hello World');
const name = object.get(user, 'profile.displayName', 'Guest');
const formatted = number.currency(1234.5, { currency: 'TRY', locale: 'tr-TR' });
```

Best for: Express controllers, services, shared utilities.

### 3. Sub-Path Imports (smallest bundle)

```typescript
import { string } from '@vorlaxen-labs/huk-js/string';
import { object } from '@vorlaxen-labs/huk-js/object';
```

Best for: front-end bundles, edge functions, libraries where every byte counts.

See [Import Strategies](reference/import-strategies.md) for a full comparison.

---

## Your First Utilities

### Slugify a Title

```typescript
import { string } from '@vorlaxen-labs/huk-js';

const slug = string.slugify('Hakan K. - Software Developer!');
```

### Validate Input

```typescript
import { string } from '@vorlaxen-labs/huk-js';

if (!string.isEmail(email)) {
  throw new ValidationError('Invalid email format');
}

if (!string.isStrongPassword(password)) {
  throw new ValidationError('Password does not meet requirements');
}
```

### Safe Nested Access

```typescript
import { object } from '@vorlaxen-labs/huk-js';

const search = object.get(req.query, 'search');
const page = object.get(req.query, 'page', 1);
```

### Type-Safe Query Parsing

```typescript
import { HuK, object } from '@vorlaxen-labs/huk-js';

const searchQuery = object.get(req.query, 'search');
const searchTerm =
  HuK.is.string(searchQuery) && searchQuery.trim().length > 0
    ? searchQuery.trim()
    : undefined;
```

---

## Available Sub-Path Imports

| Import Path | Module |
|---|---|
| `@vorlaxen-labs/huk-js` | Main entry (`HuK` + named module exports; `is` via `HuK.is` or sub-path) |
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

## Using HuK with BaR

HuK and BaR complement each other in Vorlaxen backends:

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

## Next Steps

| Topic | Link |
|---|---|
| Import style comparison | [Import Strategies](reference/import-strategies.md) |
| Runtime type checking | [Type Guards](reference/is-type-guards.md) |
| All string methods | [String Utilities](reference/string-utils.md) |
| Production patterns | [Recipes & Patterns](reference/recipes.md) |
| Complete API listing | [API Reference](reference/api-reference.md) |
