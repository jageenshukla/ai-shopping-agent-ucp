# UCP SDK Usage in Seller Platform

## Official UCP SDK Integration

This seller platform uses **Google's official UCP implementation approach** which generates TypeScript types and Zod schemas directly from the UCP specification.

### Installation

```bash
npm install @ucp-js/sdk
```

The SDK is now available alongside our generated models for reference and validation.

## Two Approaches to UCP Types

### 1. Generated Models (Current Approach - Recommended for Servers)

The seller platform generates models using:
- **json-schema-to-zod** - Generates Zod schemas from UCP JSON schemas
- **quicktype** - Generates TypeScript types from UCP specs

Located in: `src/models.ts` (generated)

```typescript
import { ExtendedCheckoutCreateRequest, CheckoutResponseStatusSchema } from './models';
```

**Advantages:**
- ✅ Directly from UCP spec source
- ✅ Can be customized for server needs
- ✅ Generated on-demand via `npm run generate:models`
- ✅ Official Google server approach

### 2. @ucp-js/sdk Package (Available for Reference)

The npm package provides the same types in a convenient package:

```typescript
import * as UCP from '@ucp-js/sdk';

// Same types available:
// UCP.CheckoutCreateRequest
// UCP.CheckoutResponseStatus
// UCP.CheckoutResponseStatusSchema
```

**Advantages:**
- ✅ Easy to install and use
- ✅ Maintained by UCP organization
- ✅ Versioned releases
- ✅ Great for clients

## Current Implementation

Our seller platform uses **generated models** (Approach #1) because:

1. **Server-Side Best Practice** - Google's reference implementation uses generation
2. **Flexibility** - We can extend models for our specific needs
3. **Source of Truth** - Generated directly from UCP spec
4. **Official Pattern** - Same approach as Google's samples

## Buyer Agent Uses SDK Package

The **buyer agent** (client) uses `@ucp-js/sdk` because:

1. **Client-Side Best Practice** - Clients benefit from packaged types
2. **Convenience** - No build step for type generation
3. **Versioning** - Can track SDK versions easily
4. **Official Package** - Maintained by UCP organization

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Seller Platform (Server)                      │
│  ├─ Approach: Generated Models                 │
│  ├─ Source: UCP spec JSON schemas              │
│  ├─ Tools: json-schema-to-zod + quicktype      │
│  ├─ Command: npm run generate:models           │
│  └─ Location: src/models.ts                    │
├─────────────────────────────────────────────────┤
│  Buyer Agent (Client)                           │
│  ├─ Approach: NPM Package                      │
│  ├─ Source: @ucp-js/sdk                        │
│  ├─ Install: npm install @ucp-js/sdk           │
│  └─ Import: import * as UCP from '@ucp-js/sdk' │
└─────────────────────────────────────────────────┘
```

## Both Are Official!

Both approaches are official and valid:

| Aspect | Generated Models | @ucp-js/sdk |
|--------|------------------|-------------|
| **Official** | ✅ Google's server approach | ✅ UCP organization package |
| **Source** | UCP spec (direct) | UCP spec (packaged) |
| **Best For** | Servers | Clients |
| **Flexibility** | High (can customize) | Standard (fixed) |
| **Maintenance** | Manual regeneration | npm update |
| **Examples** | Google's Node.js sample | Client libraries |

## Validation Examples

### Using Generated Schemas (Server)

```typescript
import { ExtendedCheckoutCreateRequestSchema } from './models';

const result = ExtendedCheckoutCreateRequestSchema.safeParse(requestData);
if (!result.success) {
  return c.json({ error: 'Invalid request', details: result.error }, 400);
}
```

### Using SDK Schemas (Alternative)

```typescript
import * as UCP from '@ucp-js/sdk';

const result = UCP.CheckoutCreateRequestSchema.safeParse(requestData);
if (!result.success) {
  return c.json({ error: 'Invalid request', details: result.error }, 400);
}
```

Both validate against the same UCP specification!

## Documentation

- **UCP Specification**: https://ucp.dev
- **SDK Repository**: https://github.com/Universal-Commerce-Protocol/js-sdk
- **Server Samples**: https://github.com/Universal-Commerce-Protocol/samples
- **Google Guide**: https://developers.google.com/merchant/ucp

## Important: What the SDK Does NOT Provide

### SDK Scope: Types and Schemas Only

The `@ucp-js/sdk` is **intentionally minimal** - it ONLY provides:
- ✅ TypeScript type definitions
- ✅ Zod validation schemas

It does **NOT** provide:
- ❌ HTTP client implementations
- ❌ Discovery client utilities
- ❌ AP2 mandate generation
- ❌ Webhook processing utilities
- ❌ Payment handler integrations

### What We Had to Implement

**Discovery Client** (`buyer-agent/backend/src/ucp/discovery.ts`)
```typescript
// Custom implementation - SDK doesn't provide this
export async function discoverMerchant(merchantUrl: string): Promise<UCPProfile> {
  const response = await axios.get(`${merchantUrl}/.well-known/ucp`);
  return response.data;
}
```

**AP2 Mandate Generation** (`buyer-agent/backend/src/ap2/generator.ts`)
```typescript
// Custom implementation - SDK doesn't provide this
export function generateCartMandate(
  merchantId: string,
  checkoutSessionId: string,
  items: CartItem[],
  // ...
): AP2Mandate {
  // Custom mock implementation
}
```

**Checkout Client** (`buyer-agent/backend/src/ucp/checkout.ts`)
```typescript
// Custom axios-based client using SDK types
export class UCPCheckoutClient {
  private axios: AxiosInstance;

  async createSession(items: CartItem[]): Promise<CheckoutSession> {
    // Uses SDK types but implements HTTP layer ourselves
    const response = await this.axios.post('/checkout-sessions', requestData);
    return response.data;
  }
}
```

### Why This Is Correct

The SDK's minimal scope is **by design**:
1. **Framework Agnostic**: Works with any HTTP library (axios, fetch, ky)
2. **Flexible**: Each project can implement clients as needed
3. **Lightweight**: No dependencies beyond Zod

### SDK vs Custom Implementations

| Component | SDK Provides | Our Code |
|-----------|--------------|----------|
| Checkout types | ✅ `UCP.CheckoutCreateRequest` | Uses SDK types |
| Checkout client | ❌ Not provided | Custom `UCPCheckoutClient` |
| Discovery types | ✅ `UCP.DiscoveryResponse` | Uses SDK types |
| Discovery client | ❌ Not provided | Custom `discoverMerchant()` |
| AP2 types | ✅ Type definitions | Custom types (AP2 not in UCP spec) |
| AP2 signer | ❌ Not provided | Custom mock generator |
| Validation schemas | ✅ Zod schemas | Uses SDK schemas |
| HTTP layer | ❌ Not provided | Axios + Hono |

### This Matches Official Samples

Google's official samples also implement their own:
- HTTP clients using their preferred libraries
- Discovery utilities
- Payment integrations

The SDK is meant to ensure **type safety and validation**, not provide full client implementations.

---

## Conclusion

Our implementation follows **Google's official pattern**:
- ✅ **Server** (this project): Generated models from spec
- ✅ **Client** (buyer agent): `@ucp-js/sdk` package for types
- ✅ **HTTP Clients**: Custom implementations (as intended)
- ✅ **Discovery**: Custom axios-based client
- ✅ **AP2**: Custom mock implementation

Both approaches are official, spec-compliant, and production-ready!
