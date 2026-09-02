# Recipes & Patterns

Production-ready patterns for integrating the Kargomucuz SDK into Node.js backends, Express services, and multi-tenant platforms.

---

## Singleton Client Factory

Create one client instance per process:

```typescript
import { Kargomucuz } from '@vorlaxen-labs/kargomucuz-sdk';

let instance: Kargomucuz | null = null;

export function getKargomucuzClient(): Kargomucuz {
  if (!instance) {
    const apiKey = process.env.KARGOMUCUZ_API_KEY ?? process.env.KM_API_KEY;
    if (!apiKey) {
      throw new Error('KARGOMUCUZ_API_KEY environment variable is required');
    }

    instance = new Kargomucuz({
      auth: { apiKey },
      baseUrl: process.env.KARGOMUCUZ_API_URL,
      environment: process.env.KM_ENVIRONMENT === 'production' ? 'production' : 'development',
      timeout: Number(process.env.KM_TIMEOUT ?? 30_000),
      convertTimeout: Number(process.env.KM_CONVERT_TIMEOUT ?? 4_000),
      logger: process.env.KM_ENVIRONMENT !== 'production',
    });
  }
  return instance;
}
```

---

## Shipping Service Layer

Encapsulate SDK calls behind a domain service:

```typescript
import {
  Kargomucuz,
  ProviderServiceCode,
  Currency,
  APIError,
  AuthError,
} from '@vorlaxen-labs/kargomucuz-sdk';

export class ShippingService {
  constructor(private readonly client: Kargomucuz) {}

  async getShippingOptions(weightOrDesi: number) {
    const carriers = [
      ProviderServiceCode.PTT_STANDART_2,
      ProviderServiceCode.HEPSIJET_STANDART_2,
      ProviderServiceCode.SURAT_STANDART_2,
      ProviderServiceCode.YURTICI_STANDART_2,
    ];

    const results = await Promise.allSettled(
      carriers.map(async serviceCode => {
        const rate = await this.client.rates.get({ serviceCode, weightOrDesi });
        return { serviceCode, ...rate };
      }),
    );

    return results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value)
      .sort((a, b) => a.amount - b.amount);
  }

  async createShipmentForOrder(order: Order, carrier: ProviderServiceCode) {
    const userClient = this.client.asUser(order.merchantId);

    const receiver = await userClient.addresses.create({
      role: 'receiver',
      title: `Order ${order.number}`,
      contact: {
        fullName: order.customer.name,
        phoneCountryCode: '90',
        phoneNumber: order.customer.phone,
        email: order.customer.email,
      },
      location: order.shippingAddress,
    });

    const created = await userClient.shipments.createByAddressIds({
      senderAddressId: order.warehouseAddressId,
      receiverAddressId: receiver.id,
      providerServiceCode: carrier,
      title: `Order #${order.number}`,
      buyerPayShippingPaymentType: 'creditcard',
      packageInfo: {
        desiOrKg: String(order.package.desi),
        width: String(order.package.width),
        height: String(order.package.height),
        depth: String(order.package.depth),
        weight: String(order.package.weight),
        itemsAmountCurrency: Currency.TRY,
        itemsTaxAmount: order.taxAmount,
        itemsAmount: order.subtotal,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    });

    const resolved = await userClient.shipments.resolveTracking(created.id);
    return { created, resolved };
  }

  async getTrackingEvents(shipmentId: string, merchantId: string) {
    const userClient = this.client.asUser(merchantId);
    const traces = await userClient.shipments.track(shipmentId);
    return traces.refinedTraces.data;
  }
}
```

---

## Express + BaR Endpoint

Expose shipping quotes through your API without leaking the SDK key:

```typescript
import { Router } from 'express';
import { ProviderServiceCode } from '@vorlaxen-labs/kargomucuz-sdk';

const router = Router();

router.post('/shipping/quote', async (req, res) => {
  const { weightOrDesi } = req.body;

  if (!weightOrDesi || weightOrDesi <= 0) {
    return res.builder.as.badRequest('Invalid weight or desi value').build();
  }

  try {
    const options = await shippingService.getShippingOptions(weightOrDesi);
    return res.builder.as.ok(options, 'Shipping options retrieved').build();
  } catch (error) {
    if (error instanceof AuthError) {
      return res.builder.as.serviceUnavailable('Shipping service unavailable').build();
    }
    throw error;
  }
});

router.post('/orders/:id/ship', async (req, res) => {
  const order = await orderService.findById(req.params.id);

  if (!order) {
    return res.builder.as.notFound('Order not found').build();
  }

  const carrier = req.body.carrier as ProviderServiceCode;

  try {
    const { created, resolved } = await shippingService.createShipmentForOrder(order, carrier);
    await orderService.updateShipment(order.id, {
      shipmentId: created.id,
      trackingBarcode: resolved.trackingBarcode,
    });

    return res.builder.as.created(
      {
        shipmentId: created.id,
        trackingBarcode: resolved.trackingBarcode,
        trackingUrl: resolved.handlerTrackingLink,
        isPttQueryable: resolved.isPttQueryable,
      },
      'Shipment created',
    ).build();
  } catch (error) {
    if (error instanceof APIError) {
      return res.builder.as.badRequest(error.message).build();
    }
    throw error;
  }
});
```

---

## Desi Calculation Helper

Calculate billable weight before rate queries:

```typescript
function calculateDesi(width: number, height: number, depth: number): number {
  return (width * height * depth) / 3000;
}

function calculateBillableWeight(
  actualWeightKg: number,
  widthCm: number,
  heightCm: number,
  depthCm: number,
): number {
  const desi = calculateDesi(widthCm, heightCm, depthCm);
  return Math.max(actualWeightKg, desi);
}
```

Usage:

```typescript
const billable = calculateBillableWeight(2.5, 30, 20, 15);
const rate = await client.rates.get({
  serviceCode: ProviderServiceCode.PTT_STANDART_2,
  weightOrDesi: billable,
});
```

---

## Address Resolution

Convert external location IDs to Kargomucuz address IDs:

```typescript
async function resolveExternalAddress(externalId: string | number) {
  const resolution = await client.addresses.resolve(externalId);

  if (!resolution) {
    throw new Error(`Address ${externalId} could not be resolved`);
  }

  return resolution;
}
```

Use when migrating from a legacy address system that stores numeric reference IDs.

---

## Multi-Tenant Scoping

Always scope address and shipment operations to the correct merchant:

```typescript
function getScopedClient(merchantId: string) {
  return getKargomucuzClient().asUser(merchantId);
}

async function listMerchantAddresses(merchantId: string) {
  return getScopedClient(merchantId).addresses.list();
}

async function createMerchantShipment(merchantId: string, request: CreateShipmentByAddressIdsRequest) {
  return getScopedClient(merchantId).shipments.createByAddressIds(request);
}
```

---

## Retry Wrapper for Transient Failures

The SDK does not include built-in retry. Wrap 5xx errors manually:

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (error instanceof APIError && error.statusCode && error.statusCode < 500) {
        throw error;
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError;
}

const shipment = await withRetry(() =>
  client.shipments.createByAddressIds(shipmentRequest),
);
```

Only retry idempotent-safe operations or operations with your own idempotency keys.

---

## Custom Logger Integration

Wire the SDK logger to your application's logging framework:

```typescript
import pino from 'pino';

const logger = pino({ name: 'kargomucuz' });

const client = new Kargomucuz({
  auth: { apiKey: process.env.KARGOMUCUZ_API_KEY! },
  logger: {
    info: (msg, ...args) => logger.info({ args }, msg),
    error: (msg, ...args) => logger.error({ args }, msg),
    warn: (msg, ...args) => logger.warn({ args }, msg),
    debug: (msg, ...args) => logger.debug({ args }, msg),
  },
});
```

---

## Environment Configuration

```typescript
function createKargomucuzConfig(): KargomucuzConfig {
  const apiKey = process.env.KARGOMUCUZ_API_KEY ?? process.env.KM_API_KEY;

  if (!apiKey) {
    throw new Error('KARGOMUCUZ_API_KEY is not set');
  }

  return {
    auth: { apiKey },
    baseUrl: process.env.KARGOMUCUZ_API_URL,
    environment: process.env.KM_ENVIRONMENT === 'production' ? 'production' : 'development',
    timeout: Number(process.env.KM_TIMEOUT ?? 30_000),
    convertTimeout: Number(process.env.KM_CONVERT_TIMEOUT ?? 4_000),
    logger: process.env.KM_ENVIRONMENT !== 'production',
  };
}
```

`.env` example:

```
KARGOMUCUZ_API_KEY=your-api-key-here
KARGOMUCUZ_USER_ID=0
KARGOMUCUZ_API_URL=https://api.kargomucuz.com
KM_ENVIRONMENT=development
KM_TIMEOUT=30000
KM_CONVERT_TIMEOUT=4000
```

> **TIP:**
