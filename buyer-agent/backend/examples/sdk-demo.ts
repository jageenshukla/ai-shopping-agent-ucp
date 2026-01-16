/**
 * UCP SDK Demo
 *
 * This file demonstrates how we use the official @ucp-js/sdk
 * for type-safe UCP protocol interactions.
 */

import * as UCP from '@ucp-js/sdk';

console.log('🎉 UCP SDK Demo\n');
console.log('Using official @ucp-js/sdk from:');
console.log('https://github.com/Universal-Commerce-Protocol/js-sdk\n');

// ============================================================================
// 1. Type-Safe Checkout Request
// ============================================================================
console.log('1️⃣  Creating Type-Safe Checkout Request\n');

// Using official UCP types
const checkoutRequest: UCP.CheckoutCreateRequest = {
  items: [
    {
      sku: 'flower-001',
      quantity: 2,
      amount: 70.00,
      name: 'Red Roses Bouquet',
      description: 'Beautiful red roses',
    }
  ],
  continue_url: 'https://example.com/checkout/continue'
};

console.log('Checkout Request (typed with UCP.CheckoutCreateRequest):');
console.log(JSON.stringify(checkoutRequest, null, 2));
console.log('\n');

// ============================================================================
// 2. Schema Validation with Zod
// ============================================================================
console.log('2️⃣  Validating with Official UCP Schema\n');

try {
  // Validate using official UCP Zod schema
  const validated = UCP.CheckoutCreateRequestSchema.parse(checkoutRequest);
  console.log('✅ Validation passed! Request conforms to UCP spec');
  console.log(`   - ${validated.items.length} items`);
  console.log(`   - Continue URL: ${validated.continue_url}`);
} catch (error: any) {
  console.log('❌ Validation failed');
  console.log('   Error:', error.message || String(error));
}
console.log('\n');

// ============================================================================
// 3. Checkout Response Status
// ============================================================================
console.log('3️⃣  Using Official UCP Status Types\n');

// Official UCP status types (from SDK)
const validStatuses: UCP.CheckoutResponseStatus[] = [
  'incomplete',
  'ready_for_complete',
  'complete_in_progress',
  'completed',
  'canceled',
  'requires_escalation'
];

console.log('Official UCP Checkout Statuses:');
validStatuses.forEach(status => {
  console.log(`   - ${status}`);
});
console.log('\n');

// ============================================================================
// 4. Payment Handler Types
// ============================================================================
console.log('4️⃣  Payment Handler Configuration\n');

const paymentHandler: UCP.PaymentHandlerResponse = {
  id: 'shop_pay',
  name: 'com.shopify.shop_pay',
  version: '2026-01-11',
  spec: 'https://ucp.dev/specs/payment/shop_pay',
  config: {
    merchant_id: 'merchant_123',
    environment: 'sandbox'
  },
  config_schema: 'https://ucp.dev/schemas/shop_pay.json',
  instrument_schemas: [
    'https://ucp.dev/schemas/shop_pay_instrument.json'
  ]
};

console.log('Payment Handler (typed with UCP.PaymentHandlerResponse):');
console.log(JSON.stringify(paymentHandler, null, 2));
console.log('\n');

// ============================================================================
// 5. Capability Discovery
// ============================================================================
console.log('5️⃣  Capability Discovery\n');

const capability: UCP.CapabilityDiscovery = {
  name: 'dev.ucp.shopping.checkout',
  version: '2026-01-11',
  spec: 'https://ucp.dev/specs/shopping/checkout',
  schema: 'https://ucp.dev/services/shopping/openapi.json'
};

console.log('Capability (typed with UCP.CapabilityDiscovery):');
console.log(JSON.stringify(capability, null, 2));
console.log('\n');

// ============================================================================
// 6. Message Types
// ============================================================================
console.log('6️⃣  UCP Message Types\n');

const messageTypes: UCP.MessageType[] = ['error', 'warning', 'info'];
const severities: UCP.Severity[] = [
  'recoverable',
  'requires_buyer_input',
  'requires_buyer_review'
];

console.log('Message Types:', messageTypes.join(', '));
console.log('Severities:', severities.join(', '));
console.log('\n');

// ============================================================================
// Summary
// ============================================================================
console.log('✅ SDK Integration Complete!\n');
console.log('What we demonstrated:');
console.log('  ✅ TypeScript types from @ucp-js/sdk');
console.log('  ✅ Zod schema validation');
console.log('  ✅ Type-safe checkout requests');
console.log('  ✅ Official status enums');
console.log('  ✅ Payment handler types');
console.log('  ✅ Capability discovery types');
console.log('  ✅ Message and severity types');
console.log('\n');
console.log('📦 Package: @ucp-js/sdk');
console.log('🔗 Repository: https://github.com/Universal-Commerce-Protocol/js-sdk');
console.log('📚 Docs: https://ucp.dev');
