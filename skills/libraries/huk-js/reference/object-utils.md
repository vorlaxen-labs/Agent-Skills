# Object Utilities

Four focused methods for safe object manipulation — path access, selective copying, cloning, and merging.

```typescript
import { object } from '@vorlaxen-labs/huk-js';
import { get, pick, clone, merge } from '@vorlaxen-labs/huk-js/object';
```

---

## `get(obj, path, defaultValue?)`

Safely retrieves nested values using dot-notation path access.

**Signature:** `get(obj: any, path: string, defaultValue?: any): any`

```typescript
const user = {
  profile: {
    name: 'Hakan',
    settings: { theme: 'dark', lang: 'tr' },
  },
};

object.get(user, 'profile.name');
object.get(user, 'profile.age', 0);
object.get(user, 'missing.path', 'fallback');
object.get(null, 'any.path', 'safe');
```

### Why Not Optional Chaining?

Optional chaining throws on null intermediate values in some edge cases and doesn't support dynamic paths:

```typescript
const key = 'profile.name';
object.get(user, key);
user?.profile?.name;
```

`object.get` handles null/undefined roots gracefully and accepts runtime-constructed paths.

---

## `pick(obj, keys)`

Returns a new object with only the specified keys. Type-safe return: `Pick<T, K>`.

```typescript
const user = {
  id: 1,
  email: 'h@example.com',
  password: 'hashed_secret',
  role: 'admin',
  createdAt: '2026-01-01',
};

object.pick(user, ['id', 'email']);
object.pick(user, ['id', 'email', 'role']);
```

### API Response Sanitization

Strip sensitive fields before sending via BaR:

```typescript
import { object } from '@vorlaxen-labs/huk-js';

app.get('/api/users/:id', async (req, res) => {
  const user = await userService.findById(req.params.id);
  return res.builder
    .as.ok(object.pick(user, ['id', 'name', 'email', 'createdAt']))
    .build();
});
```

---

## `clone(obj)`

Creates a **deep copy** via `JSON.parse(JSON.stringify(obj))` for JSON-serializable values.

```typescript
const original = { a: 1, b: { c: 2 } };
const copy = object.clone(original);

copy.a = 99;
copy.b.c = 99;
```

Both `copy.a` and `copy.b.c` are independent of `original`. Non-JSON values (`Date`, `undefined`, functions) are not preserved faithfully.

Use for: preventing mutation of config objects, creating editable copies of defaults.

---

## `merge(target, source)`

Deep-merges `source` into a **copy** of `target`. Plain nested objects are merged recursively; arrays and primitives are replaced. Returns a new object — **does not mutate** `target`.

**Signature:** `merge<T>(target: T, source: Partial<T>): T`

```typescript
const defaults = {
  theme: 'light',
  lang: 'en',
  notifications: true,
  pagination: { page: 1, limit: 20 },
};

const userPrefs = { theme: 'dark', pagination: { page: 2 } };

object.merge(defaults, userPrefs);
// → { theme: 'dark', lang: 'en', notifications: true, pagination: { page: 2, limit: 20 } }
// defaults is unchanged
```

---

## Real-World Patterns

### Query Parameter Extraction

```typescript
import { object, HuK } from '@vorlaxen-labs/huk-js';

const searchQuery = object.get(req.query, 'search');
const searchTerm =
  HuK.is.string(searchQuery) && searchQuery.trim().length > 0
    ? searchQuery.trim()
    : undefined;
```

### Config with Defaults

```typescript
const baseConfig = { timeout: 5000, retries: 3, logLevel: 'info' };
const envConfig = object.get(process.env, 'APP_CONFIG', {});
const config = object.merge(object.clone(baseConfig), envConfig);
```

### DTO Mapping

```typescript
function toPublicUser(user: InternalUser) {
  return object.pick(user, ['id', 'displayName', 'avatarUrl', 'joinedAt']);
}
```

---

## Method Reference

| Method | Input | Output | Mutates |
|---|---|---|---|
| `get` | object, path, default? | any | No |
| `pick` | object, keys[] | Pick<T, K> | No |
| `clone` | object | deep copy (JSON) | No |
| `merge` | target, source | merged object | No |

---

## Best Practices

1. **Use `get` at API boundaries** — query params and external payloads have unpredictable shapes
2. **Use `pick` before responses** — never leak password hashes or internal fields
3. **Clone before merge** — avoid mutating shared default objects
4. **Pair with `HuK.is.*`** — validate the result of `get` before using it

> **WARNING:**
