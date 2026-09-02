# Pagination

BaR provides built-in pagination metadata via `.paginate()`. List endpoints return the item array in `data` and pagination info in `metadata.pagination`.

---

## Basic Usage

```typescript
return res.builder
  .as.ok(users)
  .paginate(total, page, limit)
  .build();
```

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `total` | `number` | Total number of records across all pages |
| `page` | `number` | Current page number (1-based) |
| `limit` | `number` | Items per page (must be > 0) |

### Generated Metadata

```typescript
interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;  // Math.ceil(total / limit)
  has_next: boolean;    // page * limit < total
}
```

**Example response:**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    { "id": 21, "name": "User 21" },
    { "id": 22, "name": "User 22" }
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

---

## Parsing Query Parameters

Extract page and limit from query strings before calling your service:

```typescript
import { ParsedQs } from 'qs';

export const parsePagination = (query: ParsedQs) => ({
  page: Math.max(1, Number(query.page) || 1),
  limit: Math.min(100, Math.max(1, Number(query.limit) || 20)),
});
```

This pattern:
- Defaults to page `1` and limit `20`
- Clamps page to minimum `1`
- Caps limit at `100` to prevent abuse

---

## Full List Endpoint Example

```typescript
app.get('/api/users', async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { users, total } = await userService.findAll({ page, limit });

  return res.builder
    .as.ok(users, 'Users retrieved')
    .paginate(total, page, limit)
    .build();
});
```

**Request:** `GET /api/users?page=2&limit=20`

---

## Reusable Helper Pattern

Extract a helper to keep controllers thin:

```typescript
import { ResponseBuilder } from '@vorlaxen-labs/bar-js';

interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
}

export const paginatedOk = <T>(
  builder: ResponseBuilder,
  items: T[],
  meta: PaginatedMeta,
) => builder.as.ok(items).paginate(meta.total, meta.page, meta.limit);
```

**Usage in controller:**
```typescript
const result = await adminUserService.list({ page, limit });

paginatedOk(res.builder, result.users, result).build();
```

Where `result` is `{ users: User[], total: number, page: number, limit: number }`.

---

## Client-Side Pagination

Front-end clients read pagination from metadata:

```typescript
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  metadata: {
    request_id: string;
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
      has_next: boolean;
    };
  };
}

function useUsers(page: number) {
  const [data, setData] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  useEffect(() => {
    fetch(`/api/users?page=${page}&limit=20`)
      .then(r => r.json())
      .then((body: PaginatedResponse<User>) => {
        setData(body.data);
        setPagination(body.metadata.pagination);
      });
  }, [page]);

  return { data, pagination };
}
```

---

## Edge Cases

### Empty Results

```typescript
return res.builder
  .as.ok([])
  .paginate(0, 1, 20)
  .build();
```

```json
{
  "data": [],
  "metadata": {
    "pagination": {
      "total": 0,
      "page": 1,
      "limit": 20,
      "total_pages": 0,
      "has_next": false
    }
  }
}
```

### Last Page

Page 5 of 5 with 100 total records and limit 20:

```json
{
  "pagination": {
    "total": 100,
    "page": 5,
    "limit": 20,
    "total_pages": 5,
    "has_next": false
  }
}
```

### Invalid Limit

`.paginate()` throws if `limit <= 0`:

```typescript
res.builder.paginate(100, 1, 0);
```

Always validate and clamp `limit` before calling `.paginate()`.

---

## Pagination with Filters

Combine pagination with query filters without changing the metadata shape:

```typescript
app.get('/api/orders', async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { status, from, to } = req.query;

  const { orders, total } = await orderService.findFiltered({
    page,
    limit,
    status: status as string,
    from: from as string,
    to: to as string,
  });

  return res.builder
    .as.ok(orders)
    .paginate(total, page, limit)
    .setMeta({ filters: { status, from, to } })
    .build();
});
```

---

## Pagination vs. Cursor-Based

BaR's `.paginate()` implements **offset pagination** (page + limit). It works well for:

- Admin dashboards with page numbers
- Small to medium datasets (< 100k rows)
- UIs with "Page 1, 2, 3..." navigation

For high-throughput feeds or infinite scroll on large datasets, consider cursor-based pagination in your service layer and return cursor info via `.setMeta()`:

```typescript
return res.builder
  .as.ok(items)
  .setMeta({
    cursor: {
      next: nextCursor,
      has_more: items.length === limit,
    },
  })
  .build();
```

---

## Best Practices

1. **Keep items in `data`, pagination in `metadata`** — don't nest pagination inside the payload
2. **Cap `limit` server-side** — never trust client-provided limits
3. **Use 1-based page numbers** — BaR's `.paginate()` expects page starting at 1
4. **Return empty arrays, not null** — `data: []` for zero results
5. **Include total even on filtered queries** — clients need it for page count UI

> **TIP:**
