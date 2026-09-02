# Type Guards

The `HuK.is` namespace provides runtime type guards that narrow `unknown` values to specific types — essential for parsing query params, request bodies, and external API responses.

```typescript
import { HuK } from '@vorlaxen-labs/huk-js';
import { is } from '@vorlaxen-labs/huk-js/is';
```

Both `HuK.is.*` and the `is` export from the sub-path provide the same methods.

---

## Available Guards

| Method | Signature | Narrows to |
|---|---|---|
| `is.string(val)` | `(unknown) => val is string` | `string` |
| `is.number(val)` | `(unknown) => val is number` | `number` |
| `is.boolean(val)` | `(unknown) => val is boolean` | `boolean` |
| `is.array(val)` | `(unknown) => val is any[]` | `any[]` |
| `is.object(val)` | `(unknown) => val is Record<string, any>` | plain object |
| `is.empty(val)` | `(unknown) => boolean` | no narrowing |

---

## `is.string(value)`

Returns `true` for any string value (`typeof val === 'string'`), including empty strings. Rejects numbers, null, objects, arrays.

```typescript
const query = req.query.search;

if (HuK.is.string(query)) {
  const term = query.trim();
}
```

**Real-world usage — admin user search:**

```typescript
import { HuK, object } from '@vorlaxen-labs/huk-js';

const searchQuery = object.get(req.query, 'search');
const searchTerm =
  HuK.is.string(searchQuery) && searchQuery.trim().length > 0
    ? searchQuery.trim()
    : undefined;

const result = await userService.list(page, limit, searchTerm);
```

---

## `is.number(value)`

Returns `true` for finite numbers. Rejects `NaN`, `Infinity`, numeric strings.

```typescript
const raw = object.get(body, 'age');

if (HuK.is.number(raw) && HuK.number.isBetween(raw, 0, 150)) {
  user.age = raw;
}
```

---

## `is.boolean(value)`

```typescript
const flag = object.get(config, 'enabled');

if (HuK.is.boolean(flag)) {
  feature.toggle(flag);
}
```

---

## `is.array(value)`

```typescript
const tags = object.get(body, 'tags');

if (HuK.is.array(tags)) {
  const cleaned = HuK.array.compact(tags.map(String));
}
```

---

## `is.object(value)`

Returns `true` for plain objects. Rejects `null`, arrays, dates, functions.

```typescript
const metadata = object.get(payload, 'metadata');

if (HuK.is.object(metadata)) {
  const version = object.get(metadata, 'version', '1.0.0');
}
```

---

## `is.empty(value)`

Returns `true` for falsy values, empty strings, empty arrays, and empty objects.

```typescript
HuK.is.empty('');        // true
HuK.is.empty('   ');      // true (whitespace only)
HuK.is.empty([]);         // true
HuK.is.empty({});         // true
HuK.is.empty(null);       // true
HuK.is.empty(undefined);  // true
HuK.is.empty('hello');    // false
HuK.is.empty([1]);        // false
HuK.is.empty(0);         // false
```

Use for guard clauses before processing:

```typescript
if (HuK.is.empty(searchTerm)) {
  return res.builder.as.badRequest('Search term is required.').build();
}
```

---

## Type Guards vs String Validation

HuK has two validation layers with different purposes:

| Layer | Module | Purpose |
|---|---|---|
| Type guards | `HuK.is.*` | Runtime type narrowing on `unknown` input |
| Format validation | `HuK.string.isEmail`, `isStrongPassword`, `isEmpty` | Business/format rules on known strings |

```typescript
const email = object.get(body, 'email');

if (!HuK.is.string(email)) {
  throw new ValidationError('Email must be a string');
}

if (!HuK.string.isEmail(email)) {
  throw new ValidationError('Invalid email format');
}
```

---

## Parsing Query Parameters Safely

Express query values are `string | ParsedQs | array | undefined`. Use type guards:

```typescript
import { HuK, object } from '@vorlaxen-labs/huk-js';

function parseSearchQuery(query: Record<string, unknown>): string | undefined {
  const raw = object.get(query, 'search');

  if (!HuK.is.string(raw)) return undefined;

  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parsePageQuery(query: Record<string, unknown>): number {
  const raw = object.get(query, 'page');

  if (HuK.is.string(raw)) {
    const parsed = Number(raw);
    return HuK.number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  }

  if (HuK.is.number(raw) && HuK.number.isInteger(raw) && raw > 0) {
    return raw;
  }

  return 1;
}
```

---

## Custom Type Guard Composition

Combine HuK guards for complex validation:

```typescript
function isNonEmptyString(val: unknown): val is string {
  return HuK.is.string(val) && !HuK.string.isEmpty(val);
}

function isPositiveInteger(val: unknown): val is number {
  return HuK.is.number(val) && HuK.number.isInteger(val) && HuK.number.isPositive(val);
}
```

---

## Best Practices

1. **Always guard before accessing** — query params and request bodies are `unknown` at the boundary
2. **Use `HuK.is.string` before `string.isEmail`** — format validators expect strings
3. **Prefer `is.empty` over manual checks** — handles whitespace, null, empty collections
4. **Don't use `is.object` for class instances** — it checks plain objects only
5. **Combine with `object.get`** — safe path access + type guard is a powerful pair

> **WARNING:**
