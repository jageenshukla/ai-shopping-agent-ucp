# UCP Seller Platform

A UCP-compliant REST API for e-commerce merchants to sell products using the Universal Commerce Protocol.

## Features

- **UCP Discovery**: `/.well-known/ucp` endpoint for protocol discovery
- **Product Catalog**: List and retrieve products via REST API
- **Checkout Sessions**: Create, update, and complete checkout sessions
- **AP2 Authorization**: Basic AP2 mandate validation with replay protection
- **Stripe Integration**: Payment processing with Stripe (test mode)
- **SQLite Database**: Lightweight database for products, sessions, and orders

## Prerequisites

- Node.js 18+ and npm
- Stripe account (test mode is fine)

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add your Stripe test keys
   ```

3. **Initialize and seed database**:
   ```bash
   npm run db:seed
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

The server will start at `http://localhost:3000`

## API Endpoints

### UCP Discovery
```bash
GET /.well-known/ucp
```

Returns UCP profile with capabilities and endpoints.

### Products
```bash
# List all products
GET /api/v1/products

# Get product by SKU
GET /api/v1/products/:sku
```

### Checkout Sessions

#### Create Session
```bash
POST /api/v1/checkout-sessions
Content-Type: application/json

{
  "items": [
    { "sku": "COFFEE-001", "quantity": 1 }
  ]
}
```

#### Get Session
```bash
GET /api/v1/checkout-sessions/:id
```

#### Update Session
```bash
PUT /api/v1/checkout-sessions/:id
Content-Type: application/json

{
  "buyer_info": {
    "email": "user@example.com",
    "name": "John Doe"
  },
  "shipping_address": {
    "line1": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94102",
    "country": "US"
  }
}
```

#### Complete Checkout
```bash
POST /api/v1/checkout-sessions/:id/complete
Content-Type: application/json

{
  "ap2_mandate": {
    "version": "1.0",
    "type": "cart_mandate",
    "merchant_id": "demo-merchant-001",
    "session_id": "SESSION_ID",
    "amount": 97.19,
    "currency": "USD",
    "timestamp": "2026-01-15T12:00:00Z",
    "nonce": "unique_random_string_32_chars",
    "signature": "mock_signature"
  },
  "payment_credential": {
    "type": "card",
    "last4": "4242"
  }
}
```

#### Cancel Session
```bash
POST /api/v1/checkout-sessions/:id/cancel
```

## Testing

Run the end-to-end test script:

```bash
npm test
# or
./tests/e2e-test.sh
```

This will test all endpoints and verify the complete checkout flow.

## Development Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production build
- `npm run db:init` - Initialize database schema
- `npm run db:seed` - Seed database with sample products
- `npm test` - Run E2E tests

## Sample Products

The database is seeded with 5 sample products:

1. **COFFEE-001** - Premium Coffee Maker ($89.99)
2. **MUG-001** - Ceramic Coffee Mug Set ($34.99)
3. **BEANS-001** - Organic Coffee Beans ($24.99)
4. **GRINDER-001** - Burr Coffee Grinder ($149.99)
5. **KETTLE-001** - Gooseneck Electric Kettle ($79.99)

## Architecture

```
seller-platform/
├── src/
│   ├── routes/
│   │   ├── discovery.ts    # UCP discovery endpoint
│   │   ├── checkout.ts     # Checkout session endpoints
│   │   └── products.ts     # Product endpoints
│   ├── services/
│   │   ├── ap2.ts          # AP2 mandate validation
│   │   └── stripe.ts       # Stripe payment integration
│   ├── db/
│   │   ├── init.ts         # Database schema and connection
│   │   └── seed.ts         # Sample data seeding
│   ├── types/
│   │   └── index.ts        # TypeScript interfaces
│   └── server.ts           # Express app entry point
├── tests/
│   └── e2e-test.sh         # End-to-end test script
└── data/
    └── seller.db           # SQLite database (auto-created)
```

## UCP Compliance

This implementation follows the Universal Commerce Protocol specification:

- ✅ UCP discovery endpoint
- ✅ Checkout session lifecycle (create → update → complete)
- ✅ AP2 Cart Mandate support (with mock signatures)
- ✅ Nonce-based replay protection
- ✅ Timestamp validation
- ✅ Payment handler configuration (Stripe)

## Security Notes

This is a POC implementation with simplified security:

- AP2 signatures are accepted without cryptographic verification (mock mode)
- Stripe integration uses test mode
- No rate limiting or advanced fraud protection
- Suitable for development and testing only

## Next Steps

For production use, consider adding:

- Full AP2 signature verification with public key crypto
- Rate limiting and DDoS protection
- Advanced fraud detection
- Webhook support for order status updates
- Admin dashboard for order management
- Real-time inventory management
- Multiple payment method support

## License

This is a proof-of-concept implementation for demonstration purposes.

## Resources

- [UCP Specification](https://ucp.dev)
- [AP2 Protocol](https://ap2-protocol.org)
- [Stripe API Documentation](https://stripe.com/docs/api)
