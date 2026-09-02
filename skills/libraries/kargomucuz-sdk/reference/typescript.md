# TypeScript Guide

The Kargomucuz SDK is written in strict TypeScript with full type definitions shipped in the package. All service methods, request payloads, and error classes are typed out of the box.

---

## Main Export

```typescript
import { Kargomucuz } from '@vorlaxen-labs/kargomucuz-sdk';
```

`Kargomucuz` is the root client class. Instantiate once and access services via getters:

```typescript
const client = new Kargomucuz({ auth: { apiKey: process.env.KARGOMUCUZ_API_KEY! } });

client.addresses.create(options);
client.rates.get({ serviceCode, weightOrDesi });
client.shipments.createByAddressIds(request);
client.shipments.track(shipmentId);
```

---

## Named Exports

```typescript
import {
  Kargomucuz,
  KargomucuzError,
  APIError,
  AuthError,
  Currency,
  ProviderServiceCode,
  isKargomucuzPanelBarcode,
  resolveTrackingBarcode,
  resolveTrackingUrl,
} from '@vorlaxen-labs/kargomucuz-sdk';
```

Type-only imports:

```typescript
import type {
  KargomucuzConfig,
  IKargomucuzLogger,
  IEnvironments,
  ApiResponse,
  ShipmentResult,
  CreateShipmentByAddressIdsRequest,
  ResolvedTracking,
  TrackingResult,
  HandlerTraceEvent,
  ConvertShipmentResult,
  ProviderEnumsResult,
} from '@vorlaxen-labs/kargomucuz-sdk';
```

Shipment types and tracking utilities are exported from the package entry point in v1.0.5.

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

Use enum members instead of raw strings for compile-time safety:

```typescript
const rate = await client.rates.get({
  serviceCode: ProviderServiceCode.PTT_STANDART_2,
  weightOrDesi: 3,
});
```

---

## Configuration Types

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

type IEnvironments = 'production' | 'development';
```

Custom logger interface:

```typescript
interface IKargomucuzLogger {
  info(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  warn?(message: string, ...args: any[]): void;
  debug?(message: string, ...args: any[]): void;
}
```

---

## Service Method Signatures

### AddressesService

```typescript
class AddressesService {
  create(options: AddressCreateOptions): Promise<Address>;
  list(): Promise<{ senders: Address[]; receivers: Address[] }>;
  retrieve(id: string): Promise<Address>;
  resolve(id: string | number): Promise<AddressResolution | null>;
}
```

### RatesService

```typescript
class RatesService {
  get(params: RateQueryOptions): Promise<RateResult>;
}
```

### ShipmentService

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

---

## ShipmentResult

```typescript
interface ShipmentResult {
  id: string;
  transactionId?: string;
  providerServiceCode: string;
  status?: string;
  createdAt?: string;
  referenceCode: string;
  agreementNumber?: string;
  trackingBarcode: string;
  handlerTrackingLink?: string;
  isPttQueryable: boolean;
  savedSenderAddress?: Address | null;
  savedReceiverAddress?: Address | null;
}
```

---

## TrackingResult

```typescript
interface TrackingResult {
  trackingId: string;
  trackingNumber: string;
  refinedTraces: { data: HandlerTraceEvent[]; totalCount?: number };
  handlerTraces: { data: HandlerTraceEvent[]; totalCount?: number };
  totalCount?: number;
  raw?: unknown;
}
```

`trackingNumber` is deprecated — use `trackingId`.

---

## Error Type Narrowing

Use `instanceof` checks for typed error handling:

```typescript
async function createAddress(options: AddressCreateOptions): Promise<Address> {
  try {
    return await client.addresses.create(options);
  } catch (error) {
    if (error instanceof AuthError) {
      throw new ConfigurationError('Invalid Kargomucuz API key');
    }
    if (error instanceof APIError) {
      throw new ValidationError(error.message, error.statusCode);
    }
    if (error instanceof KargomucuzError) {
      throw new InternalError(error.message);
    }
    throw error;
  }
}
```

TypeScript narrows correctly after each `instanceof` branch.

---

## Singleton Pattern with Types

Recommended factory for dependency injection:

```typescript
let client: Kargomucuz | null = null;

export function getKargomucuzClient(): Kargomucuz {
  if (!client) {
    client = new Kargomucuz({
      auth: { apiKey: process.env.KARGOMUCUZ_API_KEY! },
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      timeout: 30_000,
    });
  }
  return client;
}

export type KargomucuzClient = ReturnType<typeof getKargomucuzClient>;
```

Inject into services:

```typescript
class ShippingService {
  constructor(private readonly client: Kargomucuz) {}

  async quote(serviceCode: ProviderServiceCode, weight: number) {
    return this.client.rates.get({ serviceCode, weightOrDesi: weight });
  }

  async trackShipment(shipmentId: string) {
    return this.client.shipments.track(shipmentId);
  }
}
```

---

## Strict Mode Compatibility

The SDK works with `strict: true` in `tsconfig.json`. Required fields in request types are enforced at compile time:

```typescript
await client.shipments.createByAddressIds({
  senderAddressId,
  receiverAddressId,
  providerServiceCode: ProviderServiceCode.PTT_STANDART_2,
});

await client.shipments.createByAddressIds({
  senderAddressId,
  receiverAddressId,
  providerServiceCode: 'invalid',
  packageInfo,
});
```

---

## Module Resolution

The package ships with `"types": "./dist/index.d.ts"` in `package.json`. No additional `@types/*` package is needed.

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true
  }
}
```

Works with Node.js ESM, CommonJS (via bundler), and TypeScript project references.

> **TIP:**
