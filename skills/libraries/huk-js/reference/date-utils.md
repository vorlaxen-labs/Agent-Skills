# Date Utilities

Fourteen methods for formatting, comparing, and manipulating `Date` objects using native `Intl` APIs.

```typescript
import { date } from '@vorlaxen-labs/huk-js';
import { format, relative, add } from '@vorlaxen-labs/huk-js/date';
```

---

## Formatting

### `format(date, options?)`

Formats a date using `Intl.DateTimeFormat`.

```typescript
type DateFormatOptions = {
  locale?: string;
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
};
```

Uses native `Intl.DateTimeFormat` — no custom `format` string pattern is supported.

```typescript
date.format(new Date(), { dateStyle: 'long', timeStyle: 'short' });
date.format(new Date(), { dateStyle: 'full', locale: 'tr-TR' });
date.format(new Date(), { dateStyle: 'medium', locale: 'en-US' });
```

---

### `toISODate(date)`

Returns the ISO 8601 date portion only: `YYYY-MM-DD`.

```typescript
date.toISODate(new Date());
date.toISODate(new Date('2026-06-19T14:30:00Z'));
```

Use for: database date columns, grouping by day, cache keys.

---

### `relative(date, locale?)`

Returns a human-readable relative time string via `Intl.RelativeTimeFormat`.

```typescript
date.relative(new Date(Date.now() - 3600000));
date.relative(new Date(Date.now() - 86400000));
date.relative(new Date(Date.now() + 3600000));
date.relative(pastDate, 'tr-TR');
```

Use for: activity feeds, "last seen" labels, notification timestamps.

---

### `part(date, part, locale?)`

Extracts a single date component using `Intl.DateTimeFormat`.

```typescript
date.part(new Date(), 'month', 'en-US');
date.part(new Date(), 'day');
date.part(new Date(), 'year');
date.part(new Date(), 'hour');
```

Valid parts: any `Intl.DateTimeFormatPartTypes` value (`'month'`, `'day'`, `'year'`, `'hour'`, `'minute'`, etc.).

---

## Manipulation

### `add(date, amount, unit)` / `subtract(date, amount, unit)`

Supported units: `'day'`, `'month'`, `'year'`.

```typescript
date.add(new Date(), 7, 'day');
date.add(new Date(), 1, 'month');
date.add(new Date(), 1, 'year');

date.subtract(new Date(), 30, 'day');
date.subtract(new Date(), 6, 'month');
```

Returns a new `Date` — does not mutate the input.

---

### `startOf(date, unit)`

Returns a new date set to the beginning of the given unit.

```typescript
date.startOf(new Date(), 'day');
date.startOf(new Date(), 'month');
date.startOf(new Date(), 'year');
```

Use for: date range queries, "today at midnight" boundaries, monthly reports.

---

## Validation & Comparison

| Method | Description |
|---|---|
| `isValid(date)` | `true` if valid `Date` (not `Invalid Date`) |
| `isLeapYear(year)` | `true` for leap years |
| `isBefore(d1, d2)` | `d1` is earlier than `d2` |
| `isAfter(d1, d2)` | `d1` is later than `d2` |
| `isSameDay(d1, d2)` | Same calendar day (ignores time) |
| `isWeekend(d)` | Saturday or Sunday |
| `isToday(d)` | Falls on today's date |

```typescript
date.isValid(new Date('invalid'));
date.isValid(new Date());

date.isLeapYear(2024);
date.isLeapYear(2023);

date.isBefore(new Date('2025-01-01'), new Date());
date.isAfter(new Date(), new Date('2020-01-01'));
date.isSameDay(new Date(), new Date());
date.isWeekend(new Date());
date.isToday(new Date());
```

---

## Common Patterns

### Subscription Expiry

```typescript
const expiresAt = date.add(new Date(), 30, 'day');
const label = date.format(expiresAt, { dateStyle: 'long', locale: 'tr-TR' });
```

### Activity Feed Timestamp

```typescript
const timeAgo = date.relative(order.updatedAt, 'tr-TR');
```

### Date Range Filter

```typescript
const start = date.startOf(new Date(), 'month');
const end = date.add(start, 1, 'month');

const orders = await orderService.findBetween(start, end);
```

### Group Records by Day

```typescript
import { array, date } from '@vorlaxen-labs/huk-js';

const byDay = array.groupBy(events, event =>
  date.toISODate(event.createdAt)
);
```

---

## Limitations

HuK's date module intentionally does not include:

- Timezone conversion (use Luxon, date-fns-tz, or Temporal)
- Duration parsing (`"2 hours ago"` → Date)
- Cron scheduling

For timezone-aware operations, combine HuK formatting with a dedicated library.

---

## Method Reference

| Category | Methods |
|---|---|
| Format | `format`, `toISODate`, `relative`, `part` |
| Manipulate | `add`, `subtract`, `startOf` |
| Compare | `isBefore`, `isAfter`, `isSameDay`, `isToday`, `isWeekend` |
| Validate | `isValid`, `isLeapYear` |

> **TIP:**
