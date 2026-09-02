# Response Schema

Every BaR response — success or failure — follows a single, predictable envelope. This page documents every field, how values are derived, and what clients can rely on.

---

## Envelope Structure

```typescript
interface IResponse<T = unknown, M = unknown> {
  success: boolean;
  timestamp: string;
  message: string;       // always set at build time (defaults if omitted)
  data: T | null;
  metadata: IMetadata<M>;
}

interface IMetadata<TExtra = unknown> {
  request_id: string;
  server_time: string;
  status_code: number;
} & TExtra;
```

---

## Field Reference

### `success`

| Condition | Value |
|---|---|
| HTTP status `200–399` | `true` (unless overridden) |
| HTTP status `400+` | `false` (unless overridden) |
| `.forceSuccess(true/false)` | Explicit override |

```typescript
res.builder.status(200).forceSuccess(false).data(null).build();
```

> **INFO:** 
---

### `timestamp`

ISO 8601 string set at **build time** — the moment `.build()` is called.

```
"2026-06-19T14:32:01.234Z"
```

This is independent of `metadata.server_time`, which is also set at build time but lives inside metadata.

---

### `message`

Human-readable outcome description. Defaults when not explicitly set:

| Scenario | Default |
|---|---|
| Success (`success: true`) | `"Operation successful"` |
| Failure (`success: false`) | `"Operation failed"` |

Set explicitly via `.message()` or semantic presets:

```typescript
res.builder.as.ok(user, 'Profile updated successfully').build();
res.builder.as.notFound('User with this ID does not exist').build();
```

Each `.as.*` preset also has its own default message — see [Semantic Presets](reference/semantic-presets.md).

---

### `data`

The response payload. Rules:

| Response type | `data` value |
|---|---|
| Success with payload | The provided object/array/value |
| Success without payload | `null` |
| Error (4xx/5xx) | Always `null` |
| `204 No Content` | `null` (body may not be sent) |
| Undefined data | Normalized to `null` at build time |

```typescript
res.builder.as.ok({ id: 1 }).build();
res.builder.as.ok().build();
res.builder.as.unauthorized().build();
```

---

### `metadata`

Always present. Core fields:

| Field | Type | Description |
|---|---|---|
| `request_id` | `string` | Unique trace/correlation ID for this request |
| `server_time` | `string` | ISO 8601 timestamp when metadata was assembled |
| `status_code` | `number` | HTTP status code being sent |

Additional fields can be added via `.setMeta()`, `.withMetadata()`, or `.paginate()`.

**Example with custom metadata:**
```json
{
  "metadata": {
    "status_code": 200,
    "request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "server_time": "2026-06-19T14:32:01.234Z",
    "version": "2.0.0",
    "environment": "production"
  }
}
```

---

## Success Response Example

```json
{
  "success": true,
  "timestamp": "2026-06-19T14:32:01.234Z",
  "message": "User retrieved",
  "data": {
    "id": "usr_abc123",
    "email": "hakan@vorlaxen.com",
    "name": "Hakan Kaygusuz"
  },
  "metadata": {
    "status_code": 200,
    "request_id": "fddc7272-4405-4001-9858-ab40007bfa11",
    "server_time": "2026-06-19T14:32:01.234Z"
  }
}
```

---

## Error Response Example

```json
{
  "success": false,
  "timestamp": "2026-06-19T14:32:01.234Z",
  "message": "Invalid or missing credentials.",
  "data": null,
  "metadata": {
    "status_code": 401,
    "request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "server_time": "2026-06-19T14:32:01.234Z"
  }
}
```

---

## Paginated Response Example

When `.paginate()` is used, metadata includes a `pagination` object:

```json
{
  "success": true,
  "timestamp": "2026-06-19T14:32:01.234Z",
  "message": "Success",
  "data": [
    { "id": 1, "name": "Alice" },
    { "id": 2, "name": "Bob" }
  ],
  "metadata": {
    "status_code": 200,
    "request_id": "...",
    "server_time": "...",
    "pagination": {
      "total": 100,
      "page": 2,
      "limit": 20,
      "total_pages": 5,
      "has_next": true
    }
  }
}
```

See [Pagination](reference/pagination.md) for full details.

---

## No-Body Status Codes

BaR respects RFC 7230/7231 for responses that must not include a body:

```typescript
import { NO_BODY_STATUS_CODES, shouldSendResponseBody } from '@vorlaxen-labs/bar-js';

NO_BODY_STATUS_CODES; // Set { 204, 205, 304 }

shouldSendResponseBody(204); // false
shouldSendResponseBody(200); // true
```

When status is `204`, `205`, or `304`, the Express dispatcher calls `res.end()` instead of `res.json()`.

```typescript
res.builder.as.noContent().build();
```

---

## MetadataFactory

For advanced use cases, create metadata outside the builder:

```typescript
import { MetadataFactory } from '@vorlaxen-labs/bar-js';

const meta = MetadataFactory.create(
  { status_code: 200, custom_field: 'value' },
  { request_id: 'existing-trace-id' }
);
```

If no `request_id` is provided in context, a UUID v4 is generated automatically.

---

## Client-Side Contract

Front-end clients can rely on these invariants:

1. `success` is always a boolean — use it as the primary success/failure check
2. `metadata.request_id` is always present — attach it to bug reports and support tickets
3. `data` is `null` on all error responses — never parse error details from `data`
4. `metadata.status_code` mirrors the HTTP status — useful when parsing response body before checking status
5. `timestamp` and `metadata.server_time` are always ISO 8601 UTC strings

```typescript
async function apiCall<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = await res.json();

  if (!body.success) {
    throw new ApiError(body.message, body.metadata.request_id, body.metadata.status_code);
  }

  return body.data as T;
}
```

---

## Comparison with Common Patterns

| Pattern | BaR |
|---|---|
| `{ error: "message" }` | `{ success: false, message: "...", data: null, metadata: {...} }` |
| `{ data: {...} }` only | Full envelope with traceability |
| Manual `res.status(404).json(...)` | `.as.notFound("...").build()` |
| Custom pagination in body | Pagination in `metadata.pagination` |

> **TIP:**
