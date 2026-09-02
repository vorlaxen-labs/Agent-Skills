# TypeScript Guide

BaR is written in strict TypeScript. This page covers type exports, generics, Express augmentation, and advanced typing patterns.

---

## Built-in Express Types

BaR v2 ships global Express augmentation — no manual declaration file needed:

```typescript
declare global {
  namespace Express {
    interface Request {
      bar: {
        ctx: BaRContext;
      };
    }
    interface Response {
      builder: ResponseBuilder;
    }
  }
}
```

After importing `@vorlaxen-labs/bar-js`, `req.bar` and `res.builder` are recognized by TypeScript automatically.

---

## ResponseBuilder Generics

```typescript
class ResponseBuilder<T = unknown, M extends IMetadata = IMetadata>
```

| Type Param | Purpose |
|---|---|
| `T` | Shape of the `data` payload |
| `M` | Extended metadata fields |

### Typed Data

```typescript
interface User {
  id: string;
  email: string;
  name: string;
}

app.get('/api/users/:id', async (req, res) => {
  const user: User = await userService.findById(req.params.id);
  return res.builder.as.ok(user).build();
});
```

### Typed Metadata

```typescript
interface AppMetadata extends IMetadata {
  version: string;
  region: string;
}

const builder = new ResponseBuilder<User, AppMetadata>();

builder
  .as.ok(user)
  .setMeta({ version: '2.0.0', region: 'eu-west-1' })
  .build();
```

---

## IResponse Type

Use for typing API client responses:

```typescript
import type { IResponse, IMetadata } from '@vorlaxen-labs/bar-js';

type UserResponse = IResponse<User>;
type PaginatedUsers = IResponse<User[], IMetadata & { pagination: PaginationMeta }>;

async function fetchUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  const body: UserResponse = await res.json();

  if (!body.success) {
    throw new Error(body.message);
  }

  return body.data;
}
```

---

## Custom Express Types

Extend Express types in your project for additional request properties:

```typescript
import { Request, Response } from 'express';
import { ResponseBuilder } from '@vorlaxen-labs/bar-js';

interface AuthUser {
  id: string;
  role: 'user' | 'admin';
}

export interface CustomRequest extends Request {
  user?: AuthUser;
  clientIp?: string;
}

export interface CustomResponse extends Response {
  builder: ResponseBuilder;
}

export const getUser = async (req: CustomRequest, res: CustomResponse) => {
  return res.builder.as.ok(req.user).build();
};
```

---

## BaRFinalResult

When building without a dispatcher (testing, custom adapters), `.build()` returns:

```typescript
interface BaRFinalResult {
  body: {
    success: boolean;
    message: string;
    data: any;
    timestamp: string;
    metadata: any;
  };
  statusCode: number;
  headers: Record<string, any>;
  cookies: BaRCookie[];
}
```

### Testing Example

```typescript
import { ResponseBuilder } from '@vorlaxen-labs/bar-js';

describe('UserController', () => {
  it('returns user data', () => {
    const result = new ResponseBuilder()
      .as.ok({ id: '1', name: 'Hakan' })
      .build();

    expect(result.statusCode).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.data.name).toBe('Hakan');
  });
});
```

---

## transform() Type Inference

`transform()` returns a new builder with updated data type:

```typescript
const builder = res.builder.as.ok({ count: 10 });

const result = builder
  .transform(data => data.count * 2)
  .transform(n => `Count: ${n}`)
  .build();

result.body.data;
```

---

## Exported Types Reference

```typescript
import type {
  IMetadata,
  IResponse,
  BaRContext,
  BaRFinalResult,
  BaRCookie,
  BaRHookEvent,
  BarExpressOptions,
  ResponseBuilderOptions,
  CookieOptions,
  HeaderValue,
  Logger,
  PaginationMeta,
  MetadataOptions,
  IBaRDispatcher,
  Environment,
  StatusCodeCategory,
  StatusCodeType,
} from '@vorlaxen-labs/bar-js';
```

---

## Exported Values

```typescript
import {
  BaR,
  ResponseBuilder,
  ResponseAs,
  BarExpressAdapter,
  ExpressDispatcher,
  BaRHooks,
  BaRContextFactory,
  MetadataFactory,
  StatusCodes,
  DEFAULT_SECURITY_HEADERS,
  NO_BODY_STATUS_CODES,
  shouldSendResponseBody,
} from '@vorlaxen-labs/bar-js';
```

`BaR` is an alias for `ResponseBuilder`:

```typescript
const builder = new BaR(dispatcher, options, context);
```

---

## Strict Mode Recommendations

Enable strict TypeScript in your project:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

BaR's types are designed for strict mode — nullable `data` on errors is reflected in the union type.

---

## Module Resolution

BaR supports both ESM and CJS:

```json
{
  "type": "module"
}
```

```typescript
import { BarExpressAdapter } from '@vorlaxen-labs/bar-js';
```

```typescript
const { BarExpressAdapter } = require('@vorlaxen-labs/bar-js');
```

Type definitions are included — no `@types/` package needed.

---

## Type-Safe Pagination Helper

```typescript
import { ResponseBuilder, PaginationMeta } from '@vorlaxen-labs/bar-js';

interface ListMeta extends IMetadata {
  pagination: PaginationMeta;
}

export function paginatedOk<T>(
  builder: ResponseBuilder<T[], ListMeta>,
  items: T[],
  total: number,
  page: number,
  limit: number,
) {
  return builder.as.ok(items).paginate(total, page, limit);
}
```

---

## Common Type Errors

### `Property 'builder' does not exist on type 'Response'`

Import BaR before using Express types:

```typescript
import '@vorlaxen-labs/bar-js';
import express from 'express';
```

Or ensure `@vorlaxen-labs/bar-js` is in your TypeScript `types` or imported in a global types file.

### `req.bar` is undefined at runtime

BaR middleware is not registered or the route runs before `bar.handler()`.

### Generic metadata mismatch

Ensure custom metadata fields extend `IMetadata`:

```typescript
interface MyMeta extends IMetadata {
  custom: string;
}
```

> **TIP:** ```typescript
builder.setMeta({ version: '2.0.0' } satisfies Partial<IMetadata>);
```
