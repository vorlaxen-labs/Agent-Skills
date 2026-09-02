# API Reference

Complete reference for `@vorlaxen-labs/bar-js` v2.0.0 exports.

---

## ResponseBuilder

Central class for building standardized API responses.

```typescript
class ResponseBuilder<T = unknown, M extends IMetadata = IMetadata>
```

### Constructor

```typescript
new ResponseBuilder(
  dispatcher?: IBaRDispatcher,
  options?: ResponseBuilderOptions,
  context?: BaRContext,
)
```

### Methods

| Method | Returns | Description |
|---|---|---|
| `status(code: number)` | `this` | Sets HTTP status. Resets `forceSuccess` override. |
| `forceSuccess(value: boolean)` | `this` | Overrides inferred success flag. |
| `message(msg: string)` | `this` | Sets response message. |
| `data(data: T \| null)` | `this` | Sets response payload. |
| `setMeta(meta: Partial<M>)` | `this` | Merges metadata fields. Additive. |
| `withMetadata(options?: MetadataOptions)` | `this` | Merges auto-generated metadata via `MetadataFactory`. |
| `paginate(total, page, limit)` | `this` | Adds pagination to metadata. Throws if `limit <= 0`. |
| `setHeaders(key, value)` | `this` | Sets a single header. |
| `setHeaders(headers: Record)` | `this` | Sets multiple headers. |
| `header(key, value)` | `this` | Alias for single-header `setHeaders`. |
| `setCookies(name, value, options?)` | `this` | Sets a single cookie. |
| `setCookies(cookies: Record, options?)` | `this` | Sets multiple cookies. |
| `wrap(promise: Promise<T>)` | `Promise<this>` | Resolves/rejects into data/error state. |
| `transform<U>(fn: (data: T) => U)` | `ResponseBuilder<U, M>` | Transforms data. Skipped when data is null. |
| `when(condition, fn)` | `this` | Conditionally mutates builder. |
| `build()` | `BaRFinalResult` | Assembles and optionally dispatches response. |
| `as` | `ResponseAs<T, M>` | Semantic preset namespace. |

---

## ResponseAs (`.as`)

Accessed via `builder.as.*`. All methods return `ResponseBuilder`.

| Method | Status | Default Message |
|---|---|---|
| `ok(data?, message?)` | 200 | `"Success"` |
| `created(data?, message?)` | 201 | `"Resource created"` |
| `accepted(message?)` | 202 | `"Request accepted"` |
| `noContent()` | 204 | `""` |
| `badRequest(message?)` | 400 | `"Bad Request"` |
| `unauthorized(message?)` | 401 | `"Unauthorized access"` |
| `forbidden(message?)` | 403 | `"Access forbidden"` |
| `notFound(message?)` | 404 | `"Resource not found"` |
| `conflict(message?)` | 409 | `"Conflict detected"` |
| `unprocessable(message?)` | 422 | `"Unprocessable entity"` |
| `tooManyRequests(message?)` | 429 | `"Too many requests, please slow down"` |
| `internalServerError(message?)` | 500 | `"Internal server error"` |
| `serviceUnavailable(message?)` | 503 | `"Service temporarily unavailable"` |
| `gatewayTimeout(message?)` | 504 | `"Gateway timeout"` |

---

## BarExpressAdapter

Express middleware adapter.

```typescript
class BarExpressAdapter {
  constructor(options?: BarExpressOptions);
  handler(): (req, res, next) => void;
}
```

### BarExpressOptions

| Option | Type | Default | Description |
|---|---|---|---|
| `withDefaultHeaders` | `boolean` | enabled | Inject security headers. Set `false` to disable. |
| `defaultHeaders` | `Record<string, string>` | `DEFAULT_SECURITY_HEADERS` | Custom header set. |
| `environment` | `'development' \| 'production' \| 'test'` | `undefined` | Controls error masking in `wrap()`. |
| `includeStack` | `boolean` | `undefined` | Include stack traces in error messages. |
| `logger` | `Logger` | `undefined` | Logger for adapter and builder. |
| `hooks` | `BaRHooks` | `undefined` | Lifecycle hooks. |
| `requestIdHeaders` | `readonly string[]` | built-in list | Headers to read existing request ID from. |

---

## BaRHooks

```typescript
class BaRHooks {
  constructor(logger?: Logger);
  on(event: BaRHookEvent, fn: HookFn): void;
  hasListeners(event: BaRHookEvent): boolean;
  emit(event: BaRHookEvent, payload: unknown): void;
}
```

Events: `'before_build' | 'after_build' | 'before_dispatch' | 'after_dispatch' | 'error'`

---

## BaRContextFactory

```typescript
class BaRContextFactory {
  static create(
    req: { headers?: Record<string, string | string[] | undefined> },
    options?: BaRContextFactoryOptions,
  ): BaRContext;
}
```

### BaRContextFactoryOptions

| Option | Type | Description |
|---|---|---|
| `requestIdHeaders` | `readonly string[]` | Custom headers for request ID resolution. |

---

## MetadataFactory

```typescript
class MetadataFactory {
  static create(
    options?: MetadataOptions,
    context?: { request_id?: string },
  ): IMetadata;
}
```

---

## ExpressDispatcher

```typescript
class ExpressDispatcher implements IBaRDispatcher {
  constructor(res: Response, logger?: Logger);
  dispatch(result: BaRFinalResult): BaRFinalResult;
}
```

Dispatches via `res.status().json()` or `res.end()` for no-body status codes. Skips if `headersSent`.

---

## IBaRDispatcher

Implement for custom framework integration:

```typescript
interface IBaRDispatcher {
  dispatch(result: BaRFinalResult): any;
}
```

---

## StatusCodes

```typescript
const StatusCodes = {
  SUCCESSFUL: { OK: 200, CREATED: 201, ACCEPTED: 202, NO_CONTENT: 204 },
  REDIRECTION: { MOVED_PERMANENTLY: 301, FOUND: 302, NOT_MODIFIED: 304 },
  CLIENT_ERROR: {
    BAD_REQUEST: 400, UNAUTHORIZED: 401, FORBIDDEN: 403,
    NOT_FOUND: 404, METHOD_NOT_ALLOWED: 405, CONFLICT: 409,
    GONE: 410, PAYLOAD_TOO_LARGE: 413, UNSUPPORTED_MEDIA_TYPE: 415,
    UNPROCESSABLE_ENTITY: 422, TOO_MANY_REQUESTS: 429,
  },
  SERVER_ERROR: {
    INTERNAL_SERVER_ERROR: 500, NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502, SERVICE_UNAVAILABLE: 503, GATEWAY_TIMEOUT: 504,
  },
} as const;
```

---

## Constants & Utilities

| Export | Type | Description |
|---|---|---|
| `BaR` | `typeof ResponseBuilder` | Alias for ResponseBuilder |
| `DEFAULT_SECURITY_HEADERS` | `Record<string, string>` | Default security header set |
| `NO_BODY_STATUS_CODES` | `Set<number>` | `{ 204, 205, 304 }` |
| `shouldSendResponseBody(code)` | `function` | Returns `false` for no-body status codes |

---

## Types

| Type | Description |
|---|---|
| `IMetadata<TExtra>` | Core metadata shape with optional extensions |
| `IResponse<T, M>` | Full response envelope type |
| `BaRContext` | `{ request_id, start_time }` |
| `BaRFinalResult` | Result of `.build()` — body, status, headers, cookies |
| `BaRCookie` | `{ name, value, options? }` |
| `CookieOptions` | Cookie security and expiry options |
| `HeaderValue` | `string \| number \| readonly string[]` |
| `Logger` | `{ info, warn, error, debug? }` |
| `PaginationMeta` | Pagination metadata shape |
| `MetadataOptions` | Options for `MetadataFactory.create()` |
| `ResponseBuilderOptions` | Builder constructor options |
| `BaRHookEvent` | Hook event name union |
| `Environment` | `'development' \| 'production' \| 'test'` |
| `StatusCodeCategory` | `'SUCCESSFUL' \| 'REDIRECTION' \| ...` |
| `StatusCodeType` | Numeric status code literal union |

---

## Package Info

| Property | Value |
|---|---|
| Package | `@vorlaxen-labs/bar-js` |
| Version | `2.0.0` |
| License | MIT |
| Node | Not specified in package.json (uses `structuredClone`, `crypto.randomUUID`) |
| Peer deps | `express ^4 \|\| ^5` (for adapter only) |
| Runtime deps | None |

---

## Install

```bash
pnpm add @vorlaxen-labs/bar-js
npm install @vorlaxen-labs/bar-js
yarn add @vorlaxen-labs/bar-js
```
