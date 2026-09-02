# Crypto Utilities

Cryptographic helpers built on Node.js native `crypto` — UUID generation, hashing, encoding, and validation.

```typescript
import { crypto } from '@vorlaxen-labs/huk-js';
import { crypto as hukCrypto } from '@vorlaxen-labs/huk-js/crypto';
```

> **WARNING:** 
---

## `generateUuid()`

Generates a RFC 4122 v4 UUID.

```typescript
crypto.generateUuid();
crypto.generateUuid();
```

Use for: request IDs, entity primary keys, session tokens (combine with additional entropy for security-sensitive tokens).

```typescript
const orderId = crypto.generateUuid();
const correlationId = crypto.generateUuid();
```

---

## `toBase64(data)` / `fromBase64(data)`

Encode and decode strings to/from Base64.

```typescript
crypto.toBase64('Hello, World!');
crypto.fromBase64('SGVsbG8sIFdvcmxkIQ==');
```

Use for: encoding binary-safe strings in JSON payloads, basic obfuscation (not encryption).

---

## `hash(data, salt?)`

Returns a SHA-256 hash of the input as a hex string. Accepts an optional salt.

**Signature:** `hash(data: string, salt?: string): Promise<string>`

```typescript
const hashed = await crypto.hash('my-password');
const salted = await crypto.hash('my-password', 'random-salt-value');
```

Use for: password hashing (prefer bcrypt/argon2 for passwords — SHA-256 is for non-password fingerprinting), content checksums, deduplication keys.

```typescript
async function fingerprintContent(content: string): Promise<string> {
  return crypto.hash(content);
}
```

---

## Validation (`crypto.validate`)

### `isUuid(value)`

Validates RFC 4122 v4 UUID format.

```typescript
crypto.validate.isUuid('fddc7272-4405-4001-9858-ab40007bfa11');
crypto.validate.isUuid('not-a-uuid');
crypto.validate.isUuid('');
```

---

### `isSha256(value)`

Validates a SHA-256 hex string (64 hex characters).

```typescript
crypto.validate.isSha256('a'.repeat(64));
crypto.validate.isSha256('too-short');
```

---

### `isBase64(value)`

Validates Base64 encoding format.

```typescript
crypto.validate.isBase64('SGVsbG8=');
crypto.validate.isBase64('not!valid');
```

---

### `isStrongSalt(salt, minLength?)`

Validates salt strength. Default minimum length: `16`.

```typescript
crypto.validate.isStrongSalt('randomsalt123');
crypto.validate.isStrongSalt('weak', 16);
crypto.validate.isStrongSalt('short');
```

---

## Method Reference

| Method | Returns | Async |
|---|---|---|
| `generateUuid()` | `string` | No |
| `toBase64(data)` | `string` | No |
| `fromBase64(data)` | `string` | No |
| `hash(data, salt?)` | `Promise<string>` | Yes |
| `validate.isUuid(value)` | `boolean` | No |
| `validate.isSha256(value)` | `boolean` | No |
| `validate.isBase64(value)` | `boolean` | No |
| `validate.isStrongSalt(salt, minLength?)` | `boolean` | No |

---

## Common Patterns

### Validate Incoming UUID Param

```typescript
app.get('/api/orders/:id', async (req, res) => {
  if (!crypto.validate.isUuid(req.params.id)) {
    return res.builder.as.badRequest('Invalid order ID format.').build();
  }

  const order = await orderService.findById(req.params.id);
  return res.builder.as.ok(order).build();
});
```

### Content Integrity Check

```typescript
const checksum = await crypto.hash(fileContent);
await cache.set(`file:${fileId}:checksum`, checksum);
```

### Secure Token Generation

For security-sensitive tokens, combine UUID with secure random:

```typescript
import { crypto } from '@vorlaxen-labs/huk-js';
import { string } from '@vorlaxen-labs/huk-js';

const token = `${crypto.generateUuid()}-${string.secureRandom(32)}`;
```

---

## Crypto vs String Security

| Need | Module | Method |
|---|---|---|
| UUID | `crypto` | `generateUuid()` |
| SHA-256 hash | `crypto` | `hash()` |
| Base64 encode/decode | `crypto` | `toBase64` / `fromBase64` |
| Random hex string | `string` | `secureRandom()` |
| PII masking | `string` | `mask()` |
| XSS prevention | `string` | `escapeHtml()` |

> **WARNING:**
