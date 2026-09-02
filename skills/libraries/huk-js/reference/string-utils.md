# String Utilities

The `string` module covers transformations, security, and validation — 16 methods in a single namespace.

```typescript
import { string } from '@vorlaxen-labs/huk-js';
import { slugify, isEmail, mask } from '@vorlaxen-labs/huk-js/string';
```

---

## Transformations

### `slugify(text)`

Converts text to a URL-safe slug. Handles Turkish characters before lowercasing.

**Signature:** `slugify(text: string): string`

```typescript
string.slugify('Hello World! Bu Bir Testtir @2026');
string.slugify('çalışma ekranı şifreleme');
string.slugify('Hakan K. - Software Developer!');
```

| Input | Output |
|---|---|
| `ç` / `Ç` | `c` |
| `ğ` / `Ğ` | `g` |
| `ı` / `İ` | `i` |
| `ö` / `Ö` | `o` |
| `ş` / `Ş` | `s` |
| `ü` / `Ü` | `u` |

Leading/trailing hyphens are stripped automatically.

---

### `truncate(text, limit?, suffix?)`

| Parameter | Default | Description |
|---|---|---|
| `limit` | `30` | Max characters before truncation |
| `suffix` | `'...'` | Appended when truncated |

```typescript
string.truncate('This is a very long text for testing purposes', 10);
string.truncate('Short', 50);
```

Returns the original string if already within the limit.

---

### `truncateWords(text, limit?, suffix?)`

Truncates by **character limit** (default `20`), cutting at the last space before the limit. Not a word-count limit.

| Parameter | Default | Description |
|---|---|---|
| `limit` | `20` | Max characters before truncation |
| `suffix` | `'...'` | Appended when truncated |

```typescript
string.truncateWords('Bu bir test mesajıdır', 10);
// → 'Bu bir...'

string.truncateWords('The quick brown fox jumps over the lazy dog', 20);
// → 'The quick brown...'
```

---

### Case Converters

| Method | Input | Output |
|---|---|---|
| `toPascalCase` | `hello_world-test` | `HelloWorldTest` |
| `toCamelCase` | `hello_world-test` | `helloWorldTest` |
| `toTitleCase` | `hello world` | `Hello World` |
| `toSentenceCase` | `HELLO WORLD` | `Hello world` |

```typescript
string.toPascalCase('user_profile_data');
string.toCamelCase('API_RESPONSE');
string.toTitleCase('mac os x');
string.toSentenceCase('HELLO WORLD');
```

**Real-world — device name formatting:**

```typescript
const brand = device.vendor ? string.toTitleCase(device.vendor) : '';
const typeLabel = string.toTitleCase(device.type || 'Device');
```

---

### `removeWhitespace(text)`

Strips all whitespace characters (spaces, tabs, newlines).

```typescript
string.removeWhitespace('  hello   world  ');
```

---

### `removeNumbers(text)`

Removes all numeric characters.

```typescript
string.removeNumbers('Order #12345 - Item 99');
```

---

### `reverse(text)`

```typescript
string.reverse('hello');
```

---

### `interpolate(template, values)`

Replaces `{key}` placeholders in a template string.

```typescript
string.interpolate('Hello, {name}! Welcome to {platform}.', {
  name: 'Hakan',
  platform: 'Vorlaxen',
});
```

---

## Security

### `mask(value, options?)`

Masks sensitive data while keeping configurable characters visible.

| Option | Default | Description |
|---|---|---|
| `visibleStart` | `0` | Characters visible at start |
| `visibleEnd` | `4` | Characters visible at end |
| `char` | `'*'` | Mask character |

```typescript
string.mask('1234567812345678');
string.mask('905554443322', { visibleStart: 2, visibleEnd: 2, char: '#' });
string.mask('user@example.com', { visibleStart: 2, visibleEnd: 0 });
```

If `value.length <= visibleStart + visibleEnd`, returns the original string unchanged.

Use for: credit cards, phone numbers, email addresses in logs and API responses.

---

### `secureRandom(length?)`

Generates a cryptographically secure random hex string using Node.js `crypto.randomBytes`.

| Parameter | Default |
|---|---|
| `length` | `16` |

```typescript
string.secureRandom();
string.secureRandom(32);
```

> **WARNING:** 
---

### `escapeHtml(text)`

Escapes HTML special characters to prevent XSS.

| Character | Output |
|---|---|
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` |
| `'` | `&#39;` |

```typescript
string.escapeHtml('<script>alert("xss")</script>');
string.escapeHtml('User input: <b>bold</b>');
```

Use before injecting user content into HTML email templates or server-rendered pages.

---

## Validation

### `isEmail(value)`

Lightweight format check. Does not verify MX records or mailbox existence.

```typescript
string.isEmail('test@vorlaxen.com');
string.isEmail('invalid-email');
string.isEmail('');
```

---

### `isStrongPassword(value)`

Requirements:
- Minimum **8 characters**
- At least one **lowercase** letter
- At least one **uppercase** letter
- At least one **digit**
- At least one special character from `@$!%*?&`

```typescript
string.isStrongPassword('Weak123');
string.isStrongPassword('Strong@123');
string.isStrongPassword('Aa1!aaaa');
```

---

### `isEmpty(value)`

Returns `true` for falsy values and whitespace-only strings.

```typescript
string.isEmpty('');
string.isEmpty('   ');
string.isEmpty(null);
string.isEmpty(undefined);
string.isEmpty('Hakan');
```

Accepts `string | null | undefined`.

---

## Method Reference

| Method | Category | Returns |
|---|---|---|
| `slugify` | Transform | `string` |
| `truncate` | Transform | `string` |
| `truncateWords` | Transform | `string` |
| `toPascalCase` | Transform | `string` |
| `toCamelCase` | Transform | `string` |
| `toTitleCase` | Transform | `string` |
| `toSentenceCase` | Transform | `string` |
| `removeWhitespace` | Transform | `string` |
| `removeNumbers` | Transform | `string` |
| `reverse` | Transform | `string` |
| `interpolate` | Transform | `string` |
| `mask` | Security | `string` |
| `secureRandom` | Security | `string` |
| `escapeHtml` | Security | `string` |
| `isEmail` | Validation | `boolean` |
| `isStrongPassword` | Validation | `boolean` |
| `isEmpty` | Validation | `boolean` |

---

## Common Patterns

### Slug for URL + Display Name

```typescript
const title = 'My New Project!';
const slug = string.slugify(title);
const displayName = string.toTitleCase(slug.replace(/-/g, ' '));
```

### Sanitize User Display Name

```typescript
function sanitizeDisplayName(raw: string): string {
  const trimmed = raw.trim();
  if (string.isEmpty(trimmed)) return 'Anonymous';
  return string.escapeHtml(string.truncate(trimmed, 50));
}
```

### Mask PII in Logs

```typescript
logger.info({
  email: string.mask(user.email, { visibleStart: 2, visibleEnd: 0 }),
  phone: string.mask(user.phone, { visibleEnd: 4 }),
});
```

> **TIP:**
