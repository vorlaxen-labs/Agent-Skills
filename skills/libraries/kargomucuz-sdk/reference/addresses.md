# Addresses

The `addresses` service manages sender and receiver records in the Kargomucuz address book. Addresses are required before creating shipments.

```typescript
const km = new Kargomucuz({ auth: { apiKey: '...' } });
await km.asUser(userId).addresses.create(options);
```

---

## Overview

| Method | Description | Requires `asUser()` |
|---|---|---|
| `create(options)` | Create a new address | Recommended |
| `list()` | List all addresses grouped by role | Yes |
| `retrieve(id)` | Fetch a single address by ID | Yes |
| `resolve(id)` | Convert city/district ID to names | No |

---

## `create(options)`

Creates a new sender or receiver address.

### Request Type

```typescript
interface AddressCreateOptions {
  role: 'sender' | 'receiver';
  title: string;
  contact: {
    fullName: string;
    phoneCountryCode: string;
    phoneNumber: string;
    email: string;
  };
  location: {
    countryId: string;
    cityId: string | number;
    districtId: string | number;
    addressLine1: string;
    postCode: string;
  };
}
```

### Field Reference

| Field | Description |
|---|---|
| `role` | `'sender'` for warehouse/origin, `'receiver'` for delivery destination |
| `title` | Human-readable label (e.g. "Main Warehouse", "Customer Home") |
| `contact.fullName` | Contact person or company name |
| `contact.phoneCountryCode` | Country code (e.g. `"90"`) |
| `contact.phoneNumber` | Phone number without country code |
| `contact.email` | Contact email address |
| `location.countryId` | Country identifier (e.g. `"298795"` for Türkiye) |
| `location.cityId` | City reference ID from Kargomucuz |
| `location.districtId` | District reference ID from Kargomucuz |
| `location.addressLine1` | Street address |
| `location.postCode` | Postal code |

### Example: Sender

```typescript
const sender = await km.asUser(accountId).addresses.create({
  role: 'sender',
  title: 'Istanbul Warehouse',
  contact: {
    fullName: 'Vorlaxen Logistics',
    phoneCountryCode: '90',
    phoneNumber: '2125550000',
    email: 'warehouse@vorlaxen.com',
  },
  location: {
    countryId: '298795',
    cityId: 34,
    districtId: 1234,
    addressLine1: 'Organize Sanayi Bolgesi No: 12',
    postCode: '34000',
  },
});
```

### Example: Receiver

```typescript
const receiver = await km.asUser(accountId).addresses.create({
  role: 'receiver',
  title: 'Customer Delivery',
  contact: {
    fullName: 'Ahmet Yilmaz',
    phoneCountryCode: '90',
    phoneNumber: '5554443322',
    email: 'ahmet@example.com',
  },
  location: {
    countryId: '298795',
    cityId: 6,
    districtId: 5678,
    addressLine1: 'Ataturk Cad. No: 45 Daire: 3',
    postCode: '06000',
  },
});
```

### Response

Returns a normalized `Address` object:

```typescript
interface Address {
  id: string;
  role: 'sender' | 'receiver';
  title: string;
  contact: {
    fullName: string;
    phone: { number: string; country: string };
    email: string;
  };
  location: {
    country: string;
    city: string;
    district: string;
    addressLine: string;
    postCode: string;
  };
  createdAt: string;
}
```

Store `address.id` — use it as `senderAddressId` and `receiverAddressId` in `createByAddressIds()`, or as `sender.id` / `receiver.id` in `create()`.

### API Mapping

The SDK maps your input to the Kargomucuz API payload:

```
role           →  type
contact        →  by.entity, by.phone1, by.email
location       →  location.country, location.city, location.district, location.address
```

**Endpoint:** `POST /v1/addresses/{userId}`

---

## `list()`

Returns all addresses for the current user, grouped by role.

```typescript
const { senders, receivers } = await km.asUser(userId).addresses.list();
```

**Response:**
```typescript
{
  senders: Address[];
  receivers: Address[];
}
```

Returns `{ senders: [], receivers: [] }` if no addresses exist or the response is not an array.

**Endpoint:** `GET /v1/addresses/{userId}`

### Use Case: Address Picker UI

```typescript
async function getAddressOptions(userId: string) {
  const { senders, receivers } = await km.asUser(userId).addresses.list();

  return {
    senderOptions: senders.map(a => ({
      value: a.id,
      label: `${a.title} — ${a.location.city}`,
    })),
    receiverOptions: receivers.map(a => ({
      value: a.id,
      label: `${a.title} — ${a.contact.fullName}`,
    })),
  };
}
```

---

## `retrieve(id)`

Fetches a single address by ID for the current user.

```typescript
const address = await km.asUser(userId).addresses.retrieve('address_id_here');
```

Throws if the address is not found.

**Endpoint:** `GET /v1/addresses/{userId}/{id}`

Use when you have stored address IDs and need full address objects for shipment creation.

---

## `resolve(id)`

Converts a Kargomucuz address reference ID into human-readable names. Does not require `asUser()`. Uses `convertTimeout` (default 4000 ms).

```typescript
const resolution = await km.addresses.resolve(34);

if (resolution) {
  console.log(resolution.city, resolution.district);
}
```

**Response:**
```typescript
interface AddressResolution {
  id: string | number;
  referenceId: string;
  city: string;
  district: string;
}
```

Returns `null` if the ID cannot be resolved.

**Endpoint:** `POST /others/convert-address-id`

### Use Case: Checkout Form Autocomplete

When a user selects a city/district from a dropdown populated with Kargomucuz IDs, call `resolve()` to display the full location name in the order confirmation.

---

## Address Reuse Pattern

Create once, reuse across shipments:

```typescript
async function getOrCreateSender(userId: string, warehouseData: WarehouseInput): Promise<Address> {
  const { senders } = await km.asUser(userId).addresses.list();

  const existing = senders.find(s => s.title === warehouseData.title);
  if (existing) return existing;

  return km.asUser(userId).addresses.create({
    role: 'sender',
    ...warehouseData,
  });
}
```

---

## Validation Checklist

Before calling `create`, ensure:

- [ ] `phoneCountryCode` is the numeric country code (e.g. `"90"`)
- [ ] `cityId` and `districtId` are valid Kargomucuz reference IDs
- [ ] `email` is a valid format
- [ ] `role` matches intended usage (`sender` vs `receiver`)
- [ ] `asUser()` is called with the correct account ID for multi-tenant apps

---

## Error Cases

| Error | Cause |
|---|---|
| `AuthError` | Invalid API key |
| `APIError` | Invalid city/district ID, missing required field |
| `APIError('Address data missing in API response.', ...)` | API returned success but no payload data |

Always wrap address operations in try/catch — see [Errors & Types](reference/errors.md).

> **TIP:**
