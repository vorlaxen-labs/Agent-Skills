# Import Strategies

HuK is designed for tree-shaking. This page explains the three import styles and when to use each.

---

## Style 1: Namespace Import

```typescript
import { HuK } from '@vorlaxen-labs/huk-js';

HuK.string.slugify('hello');
HuK.number.format(1234);
HuK.object.get(obj, 'a.b.c');
HuK.is.string(value);
HuK.fn.debounce(fn, 300);
HuK.crypto.generateUuid();
HuK.storage.set('key', value);
HuK.date.format(new Date());
HuK.array.unique([1, 2, 2, 3]);
```

**Pros:**
- Single import, discoverable API via autocomplete
- Consistent `HuK.module.method` pattern

**Cons:**
- Bundlers may include more code if tree-shaking is not configured

**Best for:** Backend services, scripts, rapid prototyping.

---

## Style 2: Named Module Exports

```typescript
import { string, number, object, array, date, fn, crypto, storage } from '@vorlaxen-labs/huk-js';
```

Each export is a pre-bound module object:

```typescript
string.slugify('hello');
number.clamp(5, 0, 10);
object.pick(user, ['id', 'email']);
```

**Pros:**
- Explicit about which modules you use
- Good tree-shaking with modern bundlers
- Matches how Vorlaxen server code imports HuK

**Cons:**
- Multiple named imports in a single file

**Best for:** Controllers, services, shared utilities — the recommended backend pattern.

---

## Style 3: Sub-Path Imports

```typescript
import { string } from '@vorlaxen-labs/huk-js/string';
import { object } from '@vorlaxen-labs/huk-js/object';
import { isEmail, slugify } from '@vorlaxen-labs/huk-js/string';
```

Sub-path imports load only the target module's code.

**Available paths:**

```
@vorlaxen-labs/huk-js/string
@vorlaxen-labs/huk-js/number
@vorlaxen-labs/huk-js/date
@vorlaxen-labs/huk-js/array
@vorlaxen-labs/huk-js/object
@vorlaxen-labs/huk-js/is
@vorlaxen-labs/huk-js/fn
@vorlaxen-labs/huk-js/crypto
@vorlaxen-labs/huk-js/storage
```

**Pros:**
- Smallest possible bundle footprint
- Clear module boundary in import path

**Cons:**
- More verbose import lines
- `HuK.is` is only available via main import or `@vorlaxen-labs/huk-js/is`

**Best for:** Front-end apps, serverless functions, published libraries.

---

## Style 4: Named Function Exports

Individual functions can be imported directly from sub-paths:

```typescript
import { slugify, isEmail, mask } from '@vorlaxen-labs/huk-js/string';
import { clamp, format, currency } from '@vorlaxen-labs/huk-js/number';
import { get, pick, clone, merge } from '@vorlaxen-labs/huk-js/object';
import { debounce, throttle, memoize } from '@vorlaxen-labs/huk-js/fn';
```

**Pros:**
- Maximum tree-shaking — only the exact function is bundled
- Clean destructuring in small files

**Cons:**
- Long import lines when using many functions

**Best for:** Single-purpose utility files, micro-modules.

---

## Comparison Table

| Style | Import | Tree-Shaking | Discoverability | Verbose |
|---|---|---|---|---|
| Namespace | `HuK.string.slugify()` | Moderate | Excellent | Low |
| Named module | `string.slugify()` | Good | Good | Low |
| Sub-path module | `from '.../string'` | Excellent | Good | Medium |
| Named function | `from '.../string'` | Best | Moderate | High |

---

## ESM vs CJS

HuK ships both formats:

```typescript
import { string } from '@vorlaxen-labs/huk-js';
```

```javascript
const { string } = require('@vorlaxen-labs/huk-js');
```

Type definitions are included — no `@types/` package needed.

---

## Project Conventions

Recommended conventions for Vorlaxen backends:

```typescript
import { string, object } from '@vorlaxen-labs/huk-js';
import { HuK } from '@vorlaxen-labs/huk-js';
```

| Use case | Import |
|---|---|
| String transforms in services | `import { string } from '@vorlaxen-labs/huk-js'` |
| Query param parsing | `import { object, HuK } from '@vorlaxen-labs/huk-js'` |
| Type guard on unknown input | `HuK.is.string(value)` |
| Crypto in auth module | `import { crypto } from '@vorlaxen-labs/huk-js/crypto'` |

---

## Anti-Patterns

### Don't re-wrap HuK functions

```typescript
export const mySlugify = (s: string) => string.slugify(s);
```

Import directly — HuK functions are already bound and tree-shakeable.

### Don't import the full namespace when you need one module

```typescript
import { HuK } from '@vorlaxen-labs/huk-js';
HuK.string.slugify(x);
```

Prefer `import { string } from '@vorlaxen-labs/huk-js/string'` in size-sensitive contexts.

### Don't mix duplicate utils

If HuK provides it, delete your local copy. One source of truth.

> **TIP:**
