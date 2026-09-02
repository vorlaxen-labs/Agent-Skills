# Client Architecture

Understanding how the Kargomucuz SDK communicates with the API — HTTP layer, interceptors, response envelope, and service composition.

---

## Layer Overview

```
Application Code
      │
      ▼
Kargomucuz (facade)
      │
      ├── AddressesService
      ├── RatesService
      └── ShipmentService
              │
              ▼
         HttpClient (Axios)
              │
              ├── Request Interceptor  (logging)
              └── Response Interceptor (envelope + errors)
                      │
                      ▼
              api.kargomucuz.com
```

---

## Kargomucuz Facade

The main entry point. Holds configuration and user context.

```typescript
class Kargomucuz {
  constructor(config: KargomucuzConfig);

  asUser(id: string): this;
  getUserId(): string;
  getConfig(): KargomucuzConfig;
  getHttpClient(): HttpClient;
  getBaseUrl(): string;

  get addresses(): AddressesService;
  get rates(): RatesService;
  get shipments(): ShipmentService;
}
```

Service getters return **cached instances** created once in the `Kargomucuz` constructor. Each service receives the parent client reference and a shared `HttpClient` for config and user ID access.

---

## HttpClient

Shared HTTP layer injected into all services. Wraps Axios with SDK-specific behavior.

### Axios Instance

Created per service with:

```typescript
axios.create({
  baseURL: config.baseUrl || 'https://api.kargomucuz.com',
  timeout: config.timeout || 30_000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.auth.apiKey}`,
    'X-SDK-Client': 'true',
  },
});
```

Convert endpoints (`/others/*`) use a separate timeout via `convertTimeout` (default `4000` ms).

### Protected Methods

| Method | Description |
|---|---|
| `httpGet(url, config?)` | GET request, returns parsed `ApiResponse` |
| `httpPost(url, data?, config?)` | POST request, returns parsed `ApiResponse` |
| `httpDelete(url, config?)` | DELETE request, returns parsed `ApiResponse` |

Services call these internally — you never interact with `HttpClient` directly unless using `getHttpClient()` for advanced scenarios.

---

## Response Envelope

Every API response follows the Kargomucuz envelope:

```typescript
interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  payload?: T;
  code?: number;
  errors?: any;
}
```

The SDK interceptor checks `status`:

- `status: true` → returns the envelope to the service method
- `status: false` → throws `APIError` with `message`, `code`, and full response

Service methods then extract typed data from `payload`.

---

## Request Interceptor

Runs before every HTTP request when a `logger` is configured and environment is not `production`:

```
[KM-SDK] GET -> https://api.kargomucuz.com/v1/shipments/desi-or-kgs
Query Params: { "providerServiceCode": "ptt_standart_2", "desiOrKg": 2 }
```

POST requests also log the request body. Response payloads are logged when `logResponses: true` or in non-production environments — **only if `logger` is set**.

Without a `logger`, the interceptor passes through silently regardless of environment.

---

## Response Interceptor

### Success Path

1. Receives Axios response
2. Logs success payload (if logger enabled)
3. Checks `data.status`
4. If `false` → throws `APIError`
5. Returns envelope to caller

### Error Path

1. Logs failure details
2. Extracts error code from `response.data.code` or HTTP status
3. If `401` or `403` → throws `AuthError`
4. Otherwise → throws `APIError`

```typescript
401 / 403  →  AuthError
other      →  APIError
network    →  APIError (with axios message)
```

---

## Service Mapping

Each service translates SDK types to API payloads and maps API responses back to typed objects.

### AddressesService

| SDK Method | HTTP | Endpoint |
|---|---|---|
| `create` | POST | `/v1/addresses/{userId}` |
| `list` | GET | `/v1/addresses/{userId}` |
| `retrieve` | GET | `/v1/addresses/{userId}/{id}` |
| `resolve` | POST | `/others/convert-address-id` |

The `create` method maps `AddressCreateOptions` to the API's nested location/contact structure. The `mapAddress` private method normalizes API `_id`, `type`, `by`, and `location` fields into the SDK `Address` type.

`resolve()` uses `convertTimeout` (default 4000 ms).

### RatesService

| SDK Method | HTTP | Endpoint |
|---|---|---|
| `get` | GET | `/v1/shipments/desi-or-kgs` |

Query params: `providerServiceCode`, `desiOrKg`.

### ShipmentService

| SDK Method | HTTP | Endpoint |
|---|---|---|
| `create` / `createByAddressIds` | POST | `/v1/shipments/{userId}` |
| `getDetail` / `retrieve` | GET | `/v1/shipments/{userId}/{shipmentId}` |
| `getDetailRaw` | GET | `/v1/shipments/{userId}/{shipmentId}` |
| `list` | GET | `/v1/shipments/{userId}` |
| `delete` / `cancel` | DELETE | `/v1/shipments/{userId}/{shipmentId}` |
| `getProviders` | GET | `/v1/shipments/providers` |
| `getProviderDetail` | GET | `/v1/shipments/providers/{providerId}` |
| `getProviderEnums` | GET | `/v1/shipments/providers/enums` |
| `convertShipmentId` | POST | `/others/convert-shipment-id` |
| `convertShipmentReferenceCode` | POST | `/others/convert-shipment-reference-code` |
| `track` | GET | `/v1/shipments/traces/{userId}/{trackingId}` |

The `createByAddressIds` method maps SDK fields to API body:

```
senderAddressId    →  selectedSenderAddressId
receiverAddressId  →  selectedReceiverAddressId
```

Response mapping: `shipmentTransactionId` → `ShipmentResult.id` and `transactionId`.

Barcode fields are resolved via internal tracking utilities — see [Tracking Utilities](reference/tracking.md).

---

## User ID Flow

```
Kargomucuz constructed  →  userId = "0"
client.asUser("abc123") →  userId = "abc123"
client.addresses.list() →  GET /v1/addresses/abc123
client.shipments.createByAddressIds() → POST /v1/shipments/abc123
client.shipments.track(id) → GET /v1/shipments/traces/abc123/{id}
```

Always call `asUser()` for multi-tenant scenarios. Rate queries operate under the API key's account scope and do not embed userId in the URL.

---

## Error Propagation

Errors thrown by interceptors bubble up uncaught from service methods. Your application code should catch them at the service or controller layer:

```typescript
async function quoteShipping(weight: number) {
  try {
    return await client.rates.get({
      serviceCode: ProviderServiceCode.SURAT_STANDART_2,
      weightOrDesi: weight,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      throw new ServiceUnavailableError('Shipping provider authentication failed');
    }
    if (error instanceof APIError) {
      throw new BadRequestError(error.message);
    }
    throw error;
  }
}
```

---

## Design Principles

1. **Thin services, fat types** — all complexity is in TypeScript interfaces, not runtime logic
2. **Fail fast on envelope errors** — `status: false` never silently returns
3. **Auth errors are distinct** — `AuthError` vs `APIError` enables different remediation
4. **No manual HTTP** — never call `api.kargomucuz.com` directly when the SDK covers the endpoint
5. **Logger is opt-in** — production defaults to silent operation
6. **Best-effort converts** — convert endpoints return `null` gracefully on new records

> **INFO:**
