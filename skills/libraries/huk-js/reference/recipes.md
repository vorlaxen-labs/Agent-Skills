# Recipes & Patterns

Production-ready patterns using HuK in Vorlaxen backends — based on real server code.

---

## Query Parameter Parsing

```typescript
import { HuK, object } from '@vorlaxen-labs/huk-js';

function parseSearchTerm(query: Record<string, unknown>): string | undefined {
  const raw = object.get(query, 'search');

  if (!HuK.is.string(raw)) return undefined;

  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parsePagination(query: Record<string, unknown>) {
  const page = Number(object.get(query, 'page', 1));
  const limit = Number(object.get(query, 'limit', 20));

  return {
    page: HuK.number.isInteger(page) && page > 0 ? page : 1,
    limit: HuK.number.clamp(
      HuK.number.isInteger(limit) ? limit : 20,
      1,
      100,
    ),
  };
}
```

---

## Admin List with Search

From Vorlaxen server admin user controller:

```typescript
import { HuK, object } from '@vorlaxen-labs/huk-js';

app.get('/api/admin/users', async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const searchQuery = object.get(req.query, 'search');
  const searchTerm =
    HuK.is.string(searchQuery) && searchQuery.trim().length > 0
      ? searchQuery.trim()
      : undefined;

  const result = await adminUserService.listUsers(page, limit, searchTerm);

  return res.builder
    .as.ok(result.users)
    .paginate(result.total, result.page, result.limit)
    .build();
});
```

---

## Device Name Formatting

From Vorlaxen user-agent service:

```typescript
import { string } from '@vorlaxen-labs/huk-js';

function formatDeviceName(vendor?: string, model?: string, type?: string): string {
  const brand = vendor ? string.toTitleCase(vendor) : '';
  const typeLabel = string.toTitleCase(type || 'Device');

  if (brand && model) {
    return model.toLowerCase().includes(brand.toLowerCase())
      ? model
      : `${brand} ${model}`;
  }

  return model || `${brand || 'Unknown'} ${typeLabel}`.trim();
}
```

---

## Input Validation Pipeline

```typescript
import { string, object, HuK } from '@vorlaxen-labs/huk-js';

interface SignUpInput {
  email: string;
  password: string;
  displayName: string;
}

function validateSignUpInput(body: unknown): SignUpInput {
  if (!HuK.is.object(body)) {
    throw new ValidationError('Invalid request body');
  }

  const email = object.get(body, 'email');
  const password = object.get(body, 'password');
  const displayName = object.get(body, 'displayName');

  if (!HuK.is.string(email) || !string.isEmail(email)) {
    throw new ValidationError('Valid email is required');
  }

  if (!HuK.is.string(password) || !string.isStrongPassword(password)) {
    throw new ValidationError('Password does not meet requirements');
  }

  if (!HuK.is.string(displayName) || string.isEmpty(displayName)) {
    throw new ValidationError('Display name is required');
  }

  return {
    email: email.trim().toLowerCase(),
    password,
    displayName: string.truncate(displayName.trim(), 50),
  };
}
```

---

## Slug Generation for Content

```typescript
import { string } from '@vorlaxen-labs/huk-js';

function createProjectSlug(title: string): string {
  const base = string.slugify(title);
  const suffix = string.secureRandom(4);
  return `${base}-${suffix}`;
}
```

---

## PII-Safe Logging

```typescript
import { string } from '@vorlaxen-labs/huk-js';

function safeUserLog(user: { email: string; phone?: string; id: string }) {
  return {
    id: user.id,
    email: string.mask(user.email, { visibleStart: 2, visibleEnd: 0 }),
    phone: user.phone
      ? string.mask(user.phone, { visibleEnd: 4 })
      : undefined,
  };
}

logger.info(safeUserLog(user), 'User action recorded');
```

---

## Lookup Data Caching

```typescript
import { storage } from '@vorlaxen-labs/huk-js';

const CACHE_KEY = 'lookup:provinces';

async function getProvinces() {
  const cached = storage.get<Province[]>(CACHE_KEY);
  if (cached) return cached;

  const provinces = await db.provinces.findAll();
  storage.set(CACHE_KEY, provinces);
  return provinces;
}

async function invalidateProvinceCache() {
  storage.remove(CACHE_KEY);
}
```

---

## Retry External API Call

```typescript
import { fn } from '@vorlaxen-labs/huk-js/fn';

class CargoService {
  async getRate(params: RateParams) {
    return fn.retry(
      () => this.client.rates.get(params),
      3,
      2000,
    );
  }
}
```

---

## Group Dashboard Metrics

```typescript
import { array } from '@vorlaxen-labs/huk-js';

function buildStatusSummary(orders: Order[]) {
  const grouped = array.groupBy(orders, o => o.status);

  return {
    pending: grouped.pending?.length ?? 0,
    processing: grouped.processing?.length ?? 0,
    shipped: grouped.shipped?.length ?? 0,
    delivered: grouped.delivered?.length ?? 0,
    total: orders.length,
  };
}
```

---

## Sanitize API Response

```typescript
import { object } from '@vorlaxen-labs/huk-js';

const PUBLIC_USER_FIELDS = ['id', 'displayName', 'avatarUrl', 'joinedAt'] as const;

function toPublicUser(user: InternalUser) {
  return object.pick(user, [...PUBLIC_USER_FIELDS]);
}
```

---

## UUID Route Param Validation

```typescript
import { crypto } from '@vorlaxen-labs/huk-js/crypto';

function uuidParam(param: string) {
  if (!crypto.validate.isUuid(param)) {
    throw new ValidationError(`Invalid ID format: ${param}`);
  }
  return param;
}

app.get('/api/orders/:id', async (req, res) => {
  const id = uuidParam(req.params.id);
  const order = await orderService.findById(id);
  return res.builder.as.ok(order).build();
});
```

---

## Date Range Report

```typescript
import { date, array } from '@vorlaxen-labs/huk-js';

function groupOrdersByDay(orders: Order[]) {
  return array.groupBy(orders, order =>
    date.toISODate(order.createdAt)
  );
}

function getMonthReport(orders: Order[]) {
  const start = date.startOf(new Date(), 'month');
  const thisMonth = orders.filter(o => date.isAfter(o.createdAt, start));
  return groupOrdersByDay(thisMonth);
}
```

---

## Pattern Selection Guide

| Task | HuK Module | Method |
|---|---|---|
| Parse query string | `object` + `HuK.is` | `get` + `is.string` |
| Validate email | `string` | `isEmail` |
| Validate password | `string` | `isStrongPassword` |
| URL slug | `string` | `slugify` |
| Mask log output | `string` | `mask` |
| Strip sensitive fields | `object` | `pick` |
| Paginate safely | `number` | `clamp`, `isInteger` |
| Cache lookup data | `storage` | `get` / `set` |
| Retry API call | `fn` | `retry` |
| Group by status | `array` | `groupBy` |
| Format currency | `number` | `currency` |
| Relative timestamp | `date` | `relative` |

> **TIP:**
