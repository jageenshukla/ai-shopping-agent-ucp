import { v4 as uuidv4 } from 'uuid';
import { AP2Mandate, CartItem, PaymentCredential } from '../types/index.js';

export function generateCartMandate(
  merchantId: string,
  checkoutSessionId: string,
  items: CartItem[],
  totalAmount: number,
  currency: string,
  agentId: string = 'buyer-agent-001',
  agentName: string = 'UCP Buyer Agent'
): AP2Mandate {
  const nonce = uuidv4();
  const timestamp = new Date().toISOString();

  const payload = {
    merchant_id: merchantId,
    checkout_session_id: checkoutSessionId,
    items: items.map((item) => ({
      sku: item.sku,
      quantity: item.quantity,
      price: item.price || 0
    })),
    total_amount: totalAmount,
    currency: currency
  };

  const signatureInput = JSON.stringify({
    nonce,
    timestamp,
    payload
  });

  const mockSignature = Buffer.from(signatureInput).toString('base64').substring(0, 64);

  const mandate: AP2Mandate = {
    version: '1.0',
    type: 'cart_mandate',
    nonce,
    timestamp,
    issuer: {
      agent_id: agentId,
      agent_name: agentName
    },
    payload,
    signature: {
      algorithm: 'mock',
      value: mockSignature
    }
  };

  console.log('Generated AP2 mandate:', {
    nonce,
    merchant_id: merchantId,
    session_id: checkoutSessionId,
    total_amount: totalAmount
  });

  return mandate;
}

export function generatePaymentCredential(cardLast4: string = '4242'): PaymentCredential {
  const token = `mock_${uuidv4().replace(/-/g, '')}`;

  return {
    type: 'mock_payment',
    token,
    last4: cardLast4
  };
}
