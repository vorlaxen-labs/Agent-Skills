# Storage Utilities

A browser `localStorage` wrapper for client-side persistence. Values are JSON-serialized.

```typescript
import { storage } from '@vorlaxen-labs/huk-js';
import { HuK } from '@vorlaxen-labs/huk-js';
```

Both `storage.*` and `HuK.storage.*` access the same underlying store.

> **WARNING:** In Node.js / SSR environments, `storage` methods are **no-ops** — `set`/`remove`/`clear` do nothing, `get` returns the default. This is **not** an in-memory or server-side cache.

---

## API

### `set(key, value)`

Stores a value under the given key. Overwrites existing values.

```typescript
storage.set('session:abc', { userId: 42, role: 'admin' });
storage.set('config:theme', 'dark');
storage.set<number>('counter', 0);
```

Generic type parameter preserves value type:

```typescript
storage.set<UserCache>('user:1', { id: 1, name: 'Hakan' });
```

---

### `get(key, defaultValue?)`

Retrieves a value. Returns `defaultValue` (or `null`) when key doesn't exist.

```typescript
storage.get('session:abc');
storage.get('missing-key');
storage.get('missing-key', 'fallback');
storage.get<UserCache>('user:1');
```

---

### `remove(key)`

Deletes a single key.

```typescript
storage.remove('session:abc');
storage.remove('nonexistent');
```

---

### `clear()`

Removes all stored entries.

```typescript
storage.clear();
```

---

## Method Reference

| Method | Signature | Description |
|---|---|---|
| `set` | `<T>(key: string, value: T) => void` | Store value |
| `get` | `<T>(key: string, defaultValue?: T \| null) => T \| null` | Retrieve value |
| `remove` | `(key: string) => void` | Delete key |
| `clear` | `() => void` | Delete all keys |

---

## Use Cases

### Client-Side UI Preferences

```typescript
storage.set('ui:theme', 'dark');
storage.set('ui:lang', 'tr');

const theme = storage.get<string>('ui:theme', 'light');
```

### Form Draft Persistence (browser)

```typescript
storage.set('draft:checkout', { step: 2, addressId: 'abc' });
const draft = storage.get('draft:checkout');
```

> **WARNING:** Do not use `HuK.storage` for server-side caching, rate limiting, or session storage in Node.js backends. Use Redis, Memcached, or your database instead.

---

## Limitations

`HuK.storage` wraps **browser `localStorage`**:

| Limitation | Impact |
|---|---|
| Browser-only | No-op in Node.js / SSR — not usable server-side |
| Same-origin | Data scoped to the browser origin |
| ~5 MB quota | Browser storage limits apply |
| JSON serialization | `Date`, functions, `undefined` in objects are not preserved |
| No TTL built-in | Stale data unless manually invalidated |

For server-side caching, use Redis, Memcached, or your database.

---

## When to Use vs Redis

| Scenario | HuK.storage | Redis |
|---|---|---|
| Browser UI preferences / drafts | Yes | No |
| Server-side lookup cache | No | Yes |
| Session storage (production) | No | Yes |
| Rate limiting (production) | No | Yes |
| Cross-service shared state | No | Yes |

---

## Key Naming Conventions

Use namespaced keys to avoid collisions:

```typescript
storage.set('user:42:preferences', prefs);
storage.set('lookup:provinces', provinces);
storage.set('cache:config:app', config);
storage.set('ratelimit:192.168.1.1', 42);
```

Pattern: `{domain}:{identifier}[:{sub-key}]`

---

## Invalidation Patterns

### Manual Invalidation

```typescript
async function updateUser(userId: string, data: Partial<User>) {
  const updated = await userRepository.update(userId, data);
  storage.remove(`user:${userId}`);
  storage.remove(`user:${userId}:preferences`);
  return updated;
}
```

### Clear on Deploy

```typescript
process.on('SIGTERM', () => {
  storage.clear();
  process.exit(0);
});
```

---

## Best Practices

1. **Namespace all keys** — prevent collisions between modules
2. **Set explicit types on get/set** — leverage TypeScript generics
3. **Don't store secrets** — memory is readable by the process
4. **Invalidate on writes** — cache is useless if stale
5. **Use Redis in production** — unless you're certain about single-process deployment

> **WARNING:**
