# Errors & Types

The Kargomucuz SDK provides structured error classes and typed interfaces for predictable error handling across all services.

---

## Error Hierarchy

```
Error (native)
└── KargomucuzError
    ├── APIError
    └── AuthError
```

```typescript
import {
  KargomucuzError,
  APIError,
  AuthError,
} from '@vorlaxen-labs/kargomucuz-sdk';
```

---

## KargomucuzError

Base class for all SDK errors.

```typescript
class KargomucuzError extends Error {
  constructor(message: string);
}
```

Thrown for SDK-internal failures — missing payload data, unexpected response shapes.

```typescript
try {
  await km.addresses.create(options);
} catch (error) {
  if (error instanceof KargomucuzError) {
    console.error('SDK error:', error.message);
  }
}
```

---

## AuthError

Thrown when authentication fails — invalid or expired API key, insufficient permissions.

```typescript
class AuthError extends KargomucuzError {
  constructor(message?: string);
}
```

Default message: `"Authentication failed."`

Triggered on HTTP `401` and `403` responses.

```typescript
try {
  await km.addresses.list();
} catch (error) {
  if (error instanceof AuthError) {
    logger.error('Kargomucuz authentication failed — check KARGOMUCUZ_API_KEY');
    throw new ServiceUnavailableError('Shipping service temporarily unavailable');
  }
}
```

**Remediation:** Verify API key, check key permissions in Kargomucuz dashboard, rotate key if compromised.

---

## APIError

Thrown when the Kargomucuz API returns a business or server error.

```typescript
class APIError extends KargomucuzError {
  readonly statusCode?: number;
  readonly response?: any;

  constructor(message: string, statusCode?: number, response?: any);
}
```

| Property | Description |
|---|---|
| `message` | Human-readable error from API |
| `statusCode` | HTTP status or API error code |
| `response` | Raw API error response body |

Triggered when:
- API envelope returns `status: false`
- HTTP error responses (non-auth)

```typescript
try {
  await km.shipments.create(request);
} catch (error) {
  if (error instanceof APIError) {
    logger.error({
      statusCode: error.statusCode,
      message: error.message,
      response: error.response,
    });

    if (error.statusCode === 422) {
      throw new ValidationError(error.message);
    }
    throw new InternalError('Shipment creation failed');
  }
}
```

---

## ApiResponse Envelope

Internal response shape parsed by the HTTP interceptor:

```typescript
interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  payload?: T;
  code?: number;
  errors?: any;
}
```

When `status === false`, the interceptor throws `APIError` before the service method processes the response.

You do not interact with `ApiResponse` directly — service methods return typed domain objects.

---

## Domain Types

### Address Types

```typescript
interface AddressCreateOptions { ... }
interface Address { ... }
interface AddressResolution { ... }
```

### Rate Types

```typescript
interface RateQueryOptions {
  serviceCode: string;
  weightOrDesi: string | number;
}

interface RateResult {
  amount: number;
  currency: string;
  providerCode: string;
}
```

### Shipment Types

```typescript
interface CreateShipmentRequest { ... }
interface CreateShipmentByAddressIdsRequest { ... }
interface ShipmentPackageInfo { ... }
interface ShipmentItem { ... }
interface ShipmentResult { ... }
interface ResolvedTracking { ... }
interface TrackingResult { ... }
interface HandlerTraceEvent { ... }
interface ConvertShipmentResult { ... }
```

### Config Types

```typescript
interface KargomucuzConfig { ... }
interface IKargomucuzLogger { ... }
type IEnvironments = 'production' | 'development';
```

---

## Enums

```typescript
enum Currency {
  TRY = 'try',
  USD = 'usd',
  EUR = 'eur',
}

enum ProviderServiceCode {
  PTT_FIXED_PRICE = 'ptt_fixed_price',
  PTT_STANDART_2 = 'ptt_standart_2',
  HEPSIJET_STANDART_2 = 'hepsijet_standart_2',
  SURAT_STANDART_2 = 'surat_standart_2',
  UPS_STANDART_2 = 'ups_standart_2',
  KOLAYGELSIN_STANDART_2 = 'kolaygelsin_standart_2',
  YURTICI_STANDART_2 = 'yurtici_standart_2',
}
```

See [Providers & Enums](reference/providers.md) for usage details.

---

## Universal Error Handler

Production-ready error handler for service layers:

```typescript
import {
  Kargomucuz,
  KargomucuzError,
  APIError,
  AuthError,
} from '@vorlaxen-labs/kargomucuz-sdk';

export class ShippingServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false,
  ) {
    super(message);
  }
}

function handleKargomucuzError(error: unknown): never {
  if (error instanceof AuthError) {
    throw new ShippingServiceError(
      'Shipping provider authentication failed',
      'SHIPPING_AUTH_ERROR',
      false,
    );
  }

  if (error instanceof APIError) {
    const retryable = error.statusCode !== undefined && error.statusCode >= 500;
    throw new ShippingServiceError(
      error.message,
      'SHIPPING_API_ERROR',
      retryable,
    );
  }

  if (error instanceof KargomucuzError) {
    throw new ShippingServiceError(error.message, 'SHIPPING_SDK_ERROR', false);
  }

  throw error;
}

async function safeCreateShipment(request: CreateShipmentRequest) {
  try {
    return await km.shipments.create(request);
  } catch (error) {
    handleKargomucuzError(error);
  }
}
```

---

## Express + BaR Error Integration

Map shipping errors to BaR responses in your global filter:

```typescript
if (error instanceof ShippingServiceError) {
  if (error.code === 'SHIPPING_AUTH_ERROR') {
    return res.builder.as.serviceUnavailable(error.message).build();
  }
  if (error.retryable) {
    return res.builder.as.serviceUnavailable('Shipping service busy, try again').build();
  }
  return res.builder.as.badRequest(error.message).build();
}
```

---

## Error Decision Tree

```
Catch error from SDK method
│
├── AuthError?
│   └── Log critical, alert ops, return 503 to client
│
├── APIError with statusCode 4xx?
│   └── Return 400/422 with error.message to client
│
├── APIError with statusCode 5xx?
│   └── Retry (if idempotent), else return 503
│
├── KargomucuzError?
│   └── Log, return 500 with generic message
│
└── Unknown error?
    └── Re-throw to global exception filter
```

---

## Logging Best Practices

Always log the full error context without exposing the API key:

```typescript
logger.error({
  error: error instanceof Error ? error.message : error,
  statusCode: error instanceof APIError ? error.statusCode : undefined,
  operation: 'shipments.create',
  orderId: order.id,
}, 'Kargomucuz operation failed');
```

Never log:
- `KARGOMUCUZ_API_KEY`
- Full customer PII in production logs (mask with `@vorlaxen-labs/huk-js` `string.mask()`)

> **WARNING:**
