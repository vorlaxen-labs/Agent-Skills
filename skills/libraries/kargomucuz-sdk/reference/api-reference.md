# API Reference

Complete reference for `@vorlaxen-labs/kargomucuz-sdk` v1.0.5 exports.

---

## Kargomucuz

Root client class.

```typescript
class Kargomucuz {
  constructor(config: KargomucuzConfig);
}
```

### Methods

| Method | Returns | Description |
|---|---|---|
| `asUser(userId: string)` | `this` | Scopes address and shipment operations to a user/merchant ID |
| `getUserId()` | `string` | Current user ID (default `"0"`) |
| `getConfig()` | `KargomucuzConfig` | Frozen copy of the client config |
| `getHttpClient()` | `HttpClient` | Internal HTTP client instance |
| `getBaseUrl()` | `string` | API base URL (`https://api.kargomucuz.com`) |

### Service Getters

| Getter | Type | Description |
|---|---|---|
| `addresses` | `AddressesService` | Address CRUD and resolution |
| `rates` | `RatesService` | Carrier rate queries |
| `shipments` | `ShipmentService` | Shipment lifecycle, tracking, providers |

---

## KargomucuzConfig

```typescript
interface KargomucuzConfig {
  auth: { apiKey: string };
  baseUrl?: string;
  environment?: IEnvironments;
  timeout?: number;
  convertTimeout?: number;
  logger?: IKargomucuzLogger | boolean;
  logResponses?: boolean;
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `auth.apiKey` | `string` | required | Bearer token for API authentication |
| `baseUrl` | `string` | `https://api.kargomucuz.com` | API base URL override |
| `environment` | `'production' \| 'development'` | `'production'` | Controls logging verbosity |
| `timeout` | `number` | `30000` | HTTP request timeout in milliseconds |
| `convertTimeout` | `number` | `4000` | Timeout for `/others/*` convert endpoints |
| `logger` | `IKargomucuzLogger \| boolean` | `undefined` (no logging) | Custom logger or `true` for console output |
| `logResponses` | `boolean` | `false` in production | Log response payloads when logger is enabled |

---

## AddressesService

```typescript
class AddressesService {
  create(options: AddressCreateOptions): Promise<Address>;
  list(): Promise<{ senders: Address[]; receivers: Address[] }>;
  retrieve(id: string): Promise<Address>;
  resolve(id: string | number): Promise<AddressResolution | null>;
}
```

### AddressCreateOptions

| Field | Type | Required | Description |
|---|---|---|---|
| `role` | `'sender' \| 'receiver'` | yes | Address role |
| `title` | `string` | yes | Display label |
| `contact.fullName` | `string` | yes | Contact name |
| `contact.phoneCountryCode` | `string` | yes | e.g. `"90"` |
| `contact.phoneNumber` | `string` | yes | Phone without country code |
| `contact.email` | `string` | yes | Email address |
| `location.countryId` | `string` | yes | Country identifier (e.g. `"298795"` for Türkiye) |
| `location.cityId` | `string \| number` | yes | City identifier |
| `location.districtId` | `string \| number` | yes | District identifier |
| `location.addressLine1` | `string` | yes | Street address |
| `location.postCode` | `string` | yes | Postal code |

### Address

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Address ID |
| `role` | `'sender' \| 'receiver'` | Address role |
| `title` | `string` | Display label |
| `contact.fullName` | `string` | Contact name |
| `contact.phone.number` | `string` | Phone number |
| `contact.phone.country` | `string` | Country code |
| `contact.email` | `string` | Email |
| `location.country` | `string` | Country name |
| `location.city` | `string` | City name |
| `location.district` | `string` | District name |
| `location.addressLine` | `string` | Street address |
| `location.postCode` | `string` | Postal code |
| `createdAt` | `string` | ISO timestamp |

### AddressResolution

| Field | Type | Description |
|---|---|---|
| `id` | `string \| number` | Resolved address ID |
| `referenceId` | `string` | External reference ID |
| `city` | `string` | City name |
| `district` | `string` | District name |

Returns `null` if the ID cannot be resolved.

### HTTP Endpoints

| Method | SDK Call | Endpoint |
|---|---|---|
| `create()` | POST | `/v1/addresses/{userId}` |
| `list()` | GET | `/v1/addresses/{userId}` |
| `retrieve(id)` | GET | `/v1/addresses/{userId}/{id}` |
| `resolve(id)` | POST | `/others/convert-address-id` |

---

## RatesService

```typescript
class RatesService {
  get(params: RateQueryOptions): Promise<RateResult>;
}
```

### RateQueryOptions

| Field | Type | Required | Description |
|---|---|---|---|
| `serviceCode` | `string` | yes | Carrier service code (use `ProviderServiceCode`) |
| `weightOrDesi` | `string \| number` | yes | Billable weight or desi value |

### RateResult

| Field | Type | Description |
|---|---|---|
| `amount` | `number` | Shipping cost |
| `currency` | `string` | Currency code (uppercase, e.g. `"TRY"`) |
| `providerCode` | `string` | Echo of the requested service code |

Throws `APIError` when no price is found.

### HTTP Endpoints

| Method | SDK Call | Endpoint |
|---|---|---|
| `get()` | GET | `/v1/shipments/desi-or-kgs` |

Query params: `providerServiceCode`, `desiOrKg`

---

## ShipmentService

```typescript
class ShipmentService {
  create(request: CreateShipmentRequest): Promise<ShipmentResult>;
  createByAddressIds(request: CreateShipmentByAddressIdsRequest): Promise<ShipmentResult>;
  getDetail(shipmentId: string): Promise<ShipmentResult>;
  retrieve(shipmentId: string): Promise<ShipmentResult>;
  getDetailRaw(shipmentId: string): Promise<RawShipmentDetail>;
  list(options?: ListShipmentsOptions): Promise<ShipmentListResult>;
  delete(shipmentId: string): Promise<DeleteShipmentResult>;
  cancel(shipmentId: string): Promise<DeleteShipmentResult>;
  getProviders(options?: ListProvidersOptions): Promise<ShipmentProvider[]>;
  getProviderDetail(providerId: string): Promise<ShipmentProvider>;
  getProviderEnums(): Promise<ProviderEnumsResult>;
  convertShipmentId(id: string): Promise<ConvertShipmentResult | null>;
  convertShipmentReferenceCode(referenceCode: string): Promise<ConvertShipmentResult | null>;
  resolveTracking(shipmentId: string, options?): Promise<ResolvedTracking>;
  track(trackingId: string): Promise<TrackingResult>;
}
```

### CreateShipmentByAddressIdsRequest

| Field | Type | Required | Description |
|---|---|---|---|
| `senderAddressId` | `string` | yes | Sender address ID |
| `receiverAddressId` | `string` | yes | Receiver address ID |
| `providerServiceCode` | `ProviderServiceCode` | yes | Selected carrier |
| `packageInfo` | `ShipmentPackageInfo` | yes | Package dimensions and items |
| `title` | `string` | no | Default: `"Shipment"` |
| `explanation` | `string` | no | Default: `""` |
| `buyerPayShipping` | `boolean` | no | Default: `false` |
| `buyerPayProduct` | `boolean` | no | Default: `false` |
| `buyerPayShippingPaymentType` | `string` | no | e.g. `"creditcard"` |

### CreateShipmentRequest

Same as `CreateShipmentByAddressIdsRequest` but uses `sender: Address` and `receiver: Address` instead of address IDs. Delegates to `createByAddressIds()`.

### ShipmentPackageInfo

| Field | Type | Required | Description |
|---|---|---|---|
| `desiOrKg` | `string` | yes | Billable weight/desi |
| `width` | `string` | yes | Width in cm |
| `height` | `string` | yes | Height in cm |
| `depth` | `string` | yes | Depth in cm |
| `weight` | `string` | yes | Actual weight in kg |
| `itemsAmountCurrency` | `Currency` | yes | Currency for item amounts |
| `itemsTaxAmount` | `number` | yes | Total tax amount |
| `itemsAmount` | `number` | yes | Total item amount |
| `items` | `ShipmentItem[]` | yes | Line items |

### ShipmentItem

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | yes | Item name |
| `quantity` | `number` | yes | Item quantity |
| `unitPrice` | `number` | yes | Unit price |

### ShipmentResult

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Shipment ID |
| `transactionId` | `string?` | Transaction ID |
| `providerServiceCode` | `string` | Carrier used |
| `status` | `string?` | Shipment status |
| `createdAt` | `string?` | Creation timestamp |
| `referenceCode` | `string` | Numeric reference |
| `agreementNumber` | `string?` | KP barcode |
| `trackingBarcode` | `string` | Best available barcode |
| `handlerTrackingLink` | `string?` | Carrier tracking URL |
| `isPttQueryable` | `boolean` | KP barcode available |
| `savedSenderAddress` | `Address \| null?` | Saved sender reference |
| `savedReceiverAddress` | `Address \| null?` | Saved receiver reference |

### TrackingResult

| Field | Type | Description |
|---|---|---|
| `trackingId` | `string` | Shipment ID used for the query |
| `trackingNumber` | `string` | Deprecated — use `trackingId` |
| `refinedTraces` | `{ data: HandlerTraceEvent[]; totalCount?: number }` | Processed trace events |
| `handlerTraces` | `{ data: HandlerTraceEvent[]; totalCount?: number }` | Raw handler traces |
| `totalCount` | `number?` | Total trace count |
| `raw` | `unknown?` | Raw API response |

### ResolvedTracking

| Field | Type | Description |
|---|---|---|
| `referenceCode` | `string` | Numeric reference |
| `agreementNumber` | `string?` | KP barcode |
| `trackingBarcode` | `string` | Best available barcode |
| `handlerTrackingLink` | `string?` | Carrier tracking URL |
| `isPttQueryable` | `boolean` | KP barcode ready |
| `detail` | `RawShipmentDetail` | Raw shipment detail |
| `providerServiceCode` | `string?` | Carrier code |
| `createdAt` | `string?` | Creation timestamp |

### HTTP Endpoints

| Method | SDK Call | Endpoint |
|---|---|---|
| `create()` / `createByAddressIds()` | POST | `/v1/shipments/{userId}` |
| `getDetail()` / `retrieve()` | GET | `/v1/shipments/{userId}/{shipmentId}` |
| `list()` | GET | `/v1/shipments/{userId}` |
| `delete()` / `cancel()` | DELETE | `/v1/shipments/{userId}/{shipmentId}` |
| `getProviders()` | GET | `/v1/shipments/providers` |
| `getProviderDetail()` | GET | `/v1/shipments/providers/{providerId}` |
| `getProviderEnums()` | GET | `/v1/shipments/providers/enums` |
| `convertShipmentId()` | POST | `/others/convert-shipment-id` |
| `convertShipmentReferenceCode()` | POST | `/others/convert-shipment-reference-code` |
| `track()` | GET | `/v1/shipments/traces/{userId}/{trackingId}` |

---

## Enums

### ProviderServiceCode

| Member | Value |
|---|---|
| `PTT_FIXED_PRICE` | `ptt_fixed_price` |
| `PTT_STANDART_2` | `ptt_standart_2` |
| `HEPSIJET_STANDART_2` | `hepsijet_standart_2` |
| `SURAT_STANDART_2` | `surat_standart_2` |
| `UPS_STANDART_2` | `ups_standart_2` |
| `KOLAYGELSIN_STANDART_2` | `kolaygelsin_standart_2` |
| `YURTICI_STANDART_2` | `yurtici_standart_2` |

### Currency

| Member | Value |
|---|---|
| `TRY` | `try` |
| `USD` | `usd` |
| `EUR` | `eur` |

---

## Error Classes

### KargomucuzError

```typescript
class KargomucuzError extends Error {
  constructor(message: string);
}
```

Base class for all SDK errors.

### AuthError

```typescript
class AuthError extends KargomucuzError {
  constructor(message?: string);
}
```

Thrown on HTTP 401/403. Default message: `"Authentication failed."`

### APIError

```typescript
class APIError extends KargomucuzError {
  readonly statusCode?: number;
  readonly response?: unknown;
  constructor(message: string, statusCode?: number, response?: unknown);
}
```

Thrown when the API returns `status: false` or an HTTP error response.

---

## Tracking Utilities

```typescript
interface TrackingBarcodeResolution {
  referenceCode: string;
  agreementNumber?: string;
  trackingBarcode: string;
  handlerTrackingLink?: string;
  isPttQueryable: boolean;
}

function isKargomucuzPanelBarcode(value: unknown): boolean;
function findKpBarcodeInPayload(payload: unknown): string | undefined;
function resolveTrackingBarcode(
  detail: RawShipmentDetail,
  convertedReference?: string,
): TrackingBarcodeResolution;
function resolveTrackingUrl(
  detail: RawShipmentDetail,
  barcode: string,
  urlTemplate?: string,
): string | undefined;
function extractHandlerTrackingLink(detail: RawShipmentDetail): string | undefined;
```

See [Tracking Utilities](reference/tracking.md) for usage details.

---

## ApiResponse

Internal envelope parsed by HTTP interceptors:

```typescript
interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  payload?: T;
  code?: number;
  errors?: any;
}
```

- `status === false` → throws `APIError`
- HTTP 401/403 → throws `AuthError`

Service methods unwrap `payload` and return typed domain objects.

---

## IKargomucuzLogger

```typescript
interface IKargomucuzLogger {
  info(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  warn?(message: string, ...args: any[]): void;
  debug?(message: string, ...args: any[]): void;
}
```

---

## Package Exports

```typescript
export { Kargomucuz, type KargomucuzConfig } from './core';
export * from './types';
export * from './constants';
export { KargomucuzError, APIError, AuthError } from './errors';

export type {
  ShipmentResult, RawShipmentDetail, ResolvedTracking,
  CreateShipmentRequest, CreateShipmentByAddressIdsRequest,
  ConvertShipmentResult, ShipmentPackageInfo,
  TrackingResult, TrackingTraceCollection, HandlerTraceEvent,
  ListShipmentsOptions, ShipmentListResult, DeleteShipmentResult,
  ShipmentProvider, ListProvidersOptions, ProviderEnumsResult,
} from './modules/shipments/types';

export {
  isKargomucuzPanelBarcode,
  findKpBarcodeInPayload,
  resolveTrackingBarcode,
  resolveTrackingUrl,
  extractHandlerTrackingLink,
} from './utils/tracking.util';
```

> **TIP:**
