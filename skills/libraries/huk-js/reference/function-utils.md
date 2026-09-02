# Function Utilities

Eight higher-order functions for timing control, composition, and execution management.

```typescript
import { fn } from '@vorlaxen-labs/huk-js';
import { debounce, throttle, memoize, retry } from '@vorlaxen-labs/huk-js/fn';
```

---

## Timing

### `debounce(fn, delay)`

Delays execution until `delay` ms have elapsed since the last call. Resets the timer on each invocation.

**Signature:** `debounce<T>(fn: T, delay: number): (...args: Parameters<T>) => void`

```typescript
const search = fn.debounce((query: string) => {
  fetchResults(query);
}, 300);

search('h');
search('ha');
search('hak');
```

Only the last call within 300ms executes.

Use for: search inputs, resize handlers, form auto-save.

---

### `throttle(fn, limit)`

Ensures the function executes at most once per `limit` ms.

```typescript
const onScroll = fn.throttle(() => {
  updateScrollPosition();
}, 100);

window.addEventListener('scroll', onScroll);
```

Use for: scroll events, mouse move tracking, rate-limited API calls from UI.

---

### `sleep(ms)`

Returns a Promise that resolves after `ms` milliseconds.

```typescript
await fn.sleep(1000);
await fn.sleep(500);
```

Use for: retry delays, test timing, sequential async workflows.

```typescript
async function pollUntilReady(id: string) {
  while (!await isReady(id)) {
    await fn.sleep(2000);
  }
}
```

---

## Composition

### `pipe(...fns)`

Composes functions left-to-right. Each function receives the output of the previous one.

```typescript
const process = fn.pipe(
  (s: string) => s.trim(),
  (s: string) => s.toLowerCase(),
  (s: string) => s.replace(/\s+/g, '-'),
);

process('  Hello World  ');
```

---

### `compose(...fns)`

Composes functions right-to-left (mathematical composition).

```typescript
const process = fn.compose(
  (s: string) => s.replace(/\s+/g, '-'),
  (s: string) => s.toLowerCase(),
  (s: string) => s.trim(),
);

process('  Hello World  ');
```

`pipe` and `compose` produce the same result with reversed function order.

---

## Control

### `once(fn)`

Returns a function that executes only once. Subsequent calls return the cached result.

```typescript
const initialize = fn.once(() => {
  console.log('Initializing...');
  return expensiveSetup();
});

initialize();
initialize();
initialize();
```

Use for: lazy initialization, singleton setup, one-time event handlers.

---

### `memoize(fn)`

Caches function results using `JSON.stringify(args)` as the cache key.

```typescript
const expensiveCalc = fn.memoize((n: number) => {
  return n * n * n;
});

expensiveCalc(5);
expensiveCalc(5);
expensiveCalc(10);
```

Use for: pure functions with repeated inputs, lookup tables, configuration parsing.

> **INFO:** 
---

### `retry(fn, attempts?, delayMs?)`

Retries an async function on failure.

**Signature:** `retry<T>(fn: () => Promise<T>, attempts?: number, delayMs?: number): Promise<T>`

```typescript
const fetchWithRetry = () =>
  fn.retry(
    () => fetch('https://api.example.com/data').then(r => r.json()),
    3,
    1000,
  );

await fetchWithRetry();
```

Default: 3 attempts, **300 ms** delay between retries.

Use for: external API calls, database connections, transient network failures.

```typescript
async function callExternalService(payload: unknown) {
  return fn.retry(
    () => externalClient.post('/endpoint', payload),
    5,
    2000,
  );
}
```

---

## Method Reference

| Method | Category | Sync/Async |
|---|---|---|
| `debounce(fn, delay)` | Timing | Sync wrapper |
| `throttle(fn, limit)` | Timing | Sync wrapper |
| `sleep(ms)` | Timing | Async |
| `pipe(...fns)` | Composition | Sync |
| `compose(...fns)` | Composition | Sync |
| `once(fn)` | Control | Sync |
| `memoize(fn)` | Control | Sync |
| `retry(fn, attempts?, delayMs?)` | Control | Async |

---

## Backend Patterns

### Retry External API in Service Layer

```typescript
import { fn } from '@vorlaxen-labs/huk-js/fn';

class PaymentService {
  async charge(amount: number) {
    return fn.retry(
      () => this.provider.charge(amount),
      3,
      1500,
    );
  }
}
```

### Memoize Config Parsing

```typescript
const parseConfig = fn.memoize((env: string) => {
  return JSON.parse(readFileSync(`./config/${env}.json`, 'utf-8'));
});
```

### Debounce Audit Log Writes

```typescript
const flushAudit = fn.debounce(async (entries: AuditEntry[]) => {
  await auditRepository.bulkInsert(entries);
}, 5000);
```

---

## Best Practices

1. **Use `retry` for transient failures only** — don't retry validation errors
2. **Set explicit attempt counts** — don't rely on defaults in production
3. **Combine `retry` with `sleep`** — the delay between attempts is built in
4. **Don't memoize functions with side effects** — caching hides repeated executions
5. **Debounce at 250–500ms for search** — lower values cause excessive API calls

> **TIP:**
