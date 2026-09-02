# Workflows

End-to-end integration patterns from address setup through shipment creation and tracking.

---

## Workflow 1: E-Commerce Checkout (Recommended)

The most common integration — quote shipping at checkout, create shipment after payment, resolve tracking, fetch traces.

```
1. Customer enters delivery address
2. Calculate billable weight from cart + dimensions
3. Query rates for all carriers (parallel)
4. Display shipping options with prices
5. Customer selects carrier + pays
6. Create shipment with createByAddressIds()
7. resolveTracking() until KP barcode is ready
8. track(shipmentId) for trace events
9. Send tracking email to customer
```

### Implementation

```typescript
import {
  Kargomucuz,
  ProviderServiceCode,
  Currency,
} from '@vorlaxen-labs/kargomucuz-sdk';

async function checkoutShippingFlow(order: CheckoutOrder) {
  const client = getKargomucuzClient().asUser(order.merchantId);

  const receiver = await client.addresses.create({
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

  const billableWeight = calculateBillableWeight(order.package);
  const quotes = await compareCarrierRates(billableWeight);
  const selected = quotes[0];

  const created = await client.shipments.createByAddressIds({
    senderAddressId: order.warehouseAddressId,
    receiverAddressId: receiver.id,
    providerServiceCode: selected.serviceCode,
    title: `Order #${order.number}`,
    buyerPayShippingPaymentType: 'creditcard',
    packageInfo: buildPackageInfo(order),
  });

  const resolved = await client.shipments.resolveTracking(created.id, {
    attempts: 2,
    delayMs: 2000,
  });

  return {
    shipmentId: created.id,
    referenceCode: resolved.referenceCode,
    barcode: resolved.trackingBarcode,
    trackingUrl: resolved.handlerTrackingLink,
    isPttQueryable: resolved.isPttQueryable,
  };
}
```

---

## Workflow 2: Marketplace Multi-Seller

Each seller has their own sender address. The marketplace creates shipments on behalf of sellers.

```
1. Seller registers warehouse address (sender)
2. Buyer places order on seller's listing
3. Marketplace scopes client to seller account via asUser(sellerId)
4. Create receiver address from buyer delivery info
5. Quote + createByAddressIds() under seller's account
6. resolveTracking() + store tracking on order
```

```typescript
async function marketplaceFulfillment(order: MarketplaceOrder) {
  const client = getKargomucuzClient().asUser(order.sellerId);

  const receiver = await client.addresses.create({
    role: 'receiver',
    title: `Buyer: ${order.buyerName}`,
    contact: order.buyerContact,
    location: order.deliveryLocation,
  });

  const created = await client.shipments.createByAddressIds({
    senderAddressId: order.sellerWarehouseId,
    receiverAddressId: receiver.id,
    providerServiceCode: order.selectedCarrier,
    title: `Marketplace Order #${order.id}`,
    packageInfo: buildPackageInfo(order),
  });

  const resolved = await client.shipments.resolveTracking(created.id);
  return { created, resolved };
}
```

---

## Workflow 3: ERP Batch Fulfillment

Process a batch of paid orders from a warehouse queue.

```
1. Fetch pending orders from database
2. For each order: createByAddressIds() with stored address IDs
3. resolveTracking() for each shipment
4. Update order status + store shipment ID and barcode
5. Collect failures for manual review
```

```typescript
async function batchFulfillment(orders: WarehouseOrder[]) {
  const client = getKargomucuzClient();
  const results: FulfillmentResult[] = [];

  for (const order of orders) {
    try {
      const userClient = client.asUser(order.merchantId);

      const created = await userClient.shipments.createByAddressIds({
        senderAddressId: order.senderAddressId,
        receiverAddressId: order.receiverAddressId,
        providerServiceCode: order.carrier,
        title: `Batch #${order.number}`,
        packageInfo: buildPackageInfo(order),
      });

      const resolved = await userClient.shipments.resolveTracking(created.id);

      results.push({
        orderId: order.id,
        success: true,
        shipmentId: created.id,
        trackingBarcode: resolved.trackingBarcode,
      });
    } catch (error) {
      results.push({
        orderId: order.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}
```

Process sequentially to avoid rate limiting. Add delay between batches if needed.

---

## Workflow 4: Rate-First Carrier Selection

Always quote before creating — never hardcode a carrier.

```typescript
async function selectBestCarrier(
  weightOrDesi: number,
  preferredCarriers: ProviderServiceCode[],
): Promise<{ serviceCode: ProviderServiceCode; amount: number }> {
  const client = getKargomucuzClient();

  const quotes = await Promise.allSettled(
    preferredCarriers.map(async serviceCode => {
      const rate = await client.rates.get({ serviceCode, weightOrDesi });
      return { serviceCode, amount: rate.amount };
    }),
  );

  const valid = quotes
    .filter((q): q is PromiseFulfilledResult<{ serviceCode: ProviderServiceCode; amount: number }> =>
      q.status === 'fulfilled',
    )
    .map(q => q.value)
    .sort((a, b) => a.amount - b.amount);

  if (valid.length === 0) {
    throw new Error('No carriers available for this shipment');
  }

  return valid[0];
}
```

---

## Workflow 5: Address Book Management

Let users manage saved addresses before checkout.

```typescript
async function syncAddressBook(userId: string, addresses: UserAddressInput[]) {
  const client = getKargomucuzClient().asUser(userId);

  const existing = await client.addresses.list();
  const existingIds = new Set([
    ...existing.senders.map(a => a.id),
    ...existing.receivers.map(a => a.id),
  ]);

  const created = [];

  for (const addr of addresses) {
    if (addr.externalId && existingIds.has(addr.externalId)) continue;

    const result = await client.addresses.create({
      role: addr.role,
      title: addr.title,
      contact: addr.contact,
      location: addr.location,
    });

    created.push(result);
  }

  return created;
}
```

---

## Workflow 6: Tracking Status Updates

Fetch trace events for an order tracking page using the **shipment ID**.

> **WARNING:** 
```typescript
async function getOrderTracking(orderId: string) {
  const order = await orderRepository.findById(orderId);

  if (!order.shipmentId) {
    return { status: 'pending_fulfillment' };
  }

  const client = getKargomucuzClient().asUser(order.merchantId);

  const [detail, traces] = await Promise.all([
    client.shipments.getDetail(order.shipmentId),
    client.shipments.track(order.shipmentId),
  ]);

  return {
    status: detail.status ?? 'processing',
    trackingBarcode: detail.trackingBarcode,
    isPttQueryable: detail.isPttQueryable,
    handlerTrackingLink: detail.handlerTrackingLink,
    carrier: detail.providerServiceCode,
    events: traces.refinedTraces.data,
    createdAt: detail.createdAt,
  };
}
```

Expose this through your own API endpoint — never expose the Kargomucuz client to front-end code.

---

## State Machine

Recommended order/shipment status flow:

```
pending_payment
    → paid
        → address_created
            → rate_quoted
                → shipment_created
                    → tracking_resolved
                        → in_transit
                            → delivered
                                → completed

Any step → failed (with error reason stored)
Any step → cancelled (via shipments.cancel())
```

Map SDK errors to your status machine:

| SDK Error | Order Status |
|---|---|
| `AuthError` | `failed` — config issue, alert ops |
| `APIError` (4xx) | `failed` — validation, notify merchant |
| `APIError` (5xx) | `retry_pending` — transient, retry later |

---

## Integration Checklist

- [ ] API key in environment variable
- [ ] Singleton client instance with `asUser()` for multi-tenant
- [ ] Sender and receiver addresses created before shipment
- [ ] Rate quoted before shipment (or carrier pre-selected by business rules)
- [ ] `createByAddressIds()` used with stored address IDs
- [ ] `shipment.id` persisted on order record
- [ ] `resolveTracking()` called to obtain KP barcode
- [ ] `track(shipmentId)` used for trace events (not barcode)
- [ ] Errors mapped to user-friendly messages
- [ ] Kargomucuz API key never exposed to client-side code

> **TIP:**
