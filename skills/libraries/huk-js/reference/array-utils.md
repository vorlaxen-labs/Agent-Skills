# Array Utilities

Seven collection helpers for common data manipulation — no lodash required.

```typescript
import { array } from '@vorlaxen-labs/huk-js';
import { groupBy, unique, compact } from '@vorlaxen-labs/huk-js/array';
```

---

## Access

### `first(arr)` / `last(arr)`

Returns the first or last element. Returns `undefined` for empty arrays.

```typescript
array.first([1, 2, 3]);
array.first([]);
array.last(['a', 'b', 'c']);
array.last([]);
```

---

## Transformation

### `compact(arr)`

Removes falsy values: `null`, `undefined`, `0`, `''`, `false`.

```typescript
array.compact([0, 1, false, 2, '', 3, null, undefined]);
array.compact(['hello', '', 'world']);
```

Use after mapping operations that may produce nulls:

```typescript
const names = array.compact(users.map(u => u.displayName));
```

---

### `unique(arr)`

Returns a new array with duplicate values removed (first occurrence kept).

```typescript
array.unique([1, 2, 2, 3, 3, 3]);
array.unique(['a', 'b', 'a', 'c']);
```

Uses strict equality (`===`) for comparison.

---

### `flatten(arr)`

Flattens a nested array to **any depth** (`Array.prototype.flat(Infinity)`).

```typescript
array.flatten([1, [2, 3], [4, [5]]]);
// → [1, 2, 3, 4, 5]

array.flatten([[1, 2], [3, 4]]);
// → [1, 2, 3, 4]
```

---

### `shuffle(arr)`

Returns a new array with elements in random order (Fisher-Yates shuffle). Does not mutate the original.

```typescript
const items = [1, 2, 3, 4, 5];
const shuffled = array.shuffle(items);
```

Use for: randomizing quiz questions, A/B test assignment, sampling.

---

## Grouping

### `groupBy(arr, fn)`

Groups elements by a key returned from the callback.

**Signature:** `groupBy<T, K>(arr: T[], fn: (item: T) => K): Record<K, T[]>`

```typescript
const users = [
  { name: 'Alice', role: 'admin' },
  { name: 'Bob', role: 'user' },
  { name: 'Charlie', role: 'admin' },
];

array.groupBy(users, user => user.role);
```

**Result:**
```typescript
{
  admin: [
    { name: 'Alice', role: 'admin' },
    { name: 'Charlie', role: 'admin' },
  ],
  user: [{ name: 'Bob', role: 'user' }],
}
```

### Group Orders by Status

```typescript
const grouped = array.groupBy(orders, order => order.status);

const pending = grouped.pending ?? [];
const shipped = grouped.shipped ?? [];
```

### Group by Date

```typescript
const byDay = array.groupBy(events, event =>
  HuK.date.toISODate(event.createdAt)
);
```

---

## Method Reference

| Method | Signature | Mutates Input |
|---|---|---|
| `first` | `<T>(arr: T[]) => T \| undefined` | No |
| `last` | `<T>(arr: T[]) => T \| undefined` | No |
| `compact` | `<T>(arr: T[]) => T[]` | No |
| `unique` | `<T>(arr: T[]) => T[]` | No |
| `flatten` | `<T>(arr: any[]) => T[]` | No |
| `shuffle` | `<T>(arr: T[]) => T[]` | No |
| `groupBy` | `<T, K>(arr: T[], fn) => Record<K, T[]>` | No |

All methods return new arrays — originals are never modified.

---

## Pipeline Patterns

Chain array operations for data processing:

```typescript
import { array } from '@vorlaxen-labs/huk-js';

const tags = array.unique(
  array.compact(
    rawInput.split(',').map(t => t.trim())
  )
);
```

```typescript
const topRole = array.first(
  array.compact([
    grouped.admin?.length,
    grouped.user?.length,
  ].sort((a, b) => b - a))
);
```

---

## Best Practices

1. **Prefer `compact` over manual filter** — handles all falsy types consistently
2. **Use `groupBy` for status/category breakdowns** — cleaner than manual reduce
3. **Don't shuffle for security** — use `crypto.generateUuid()` for tokens
4. **Check empty arrays before `first`/`last`** — they return `undefined`, not an error

> **TIP:**
