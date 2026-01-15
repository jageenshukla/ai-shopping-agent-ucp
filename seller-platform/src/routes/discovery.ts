import { Router, Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

const UCP_BASE_URL = process.env.UCP_BASE_URL || 'http://localhost:3000';
const MERCHANT_NAME = process.env.MERCHANT_NAME || 'UCP Demo Store';
const MERCHANT_ID = process.env.MERCHANT_ID || 'demo-merchant-001';

router.get('/.well-known/ucp', (req: Request, res: Response) => {
  const ucpProfile = {
    version: '1.0',
    merchant: {
      id: MERCHANT_ID,
      name: MERCHANT_NAME,
      website: UCP_BASE_URL,
      description: 'A demo merchant implementing Universal Commerce Protocol'
    },
    capabilities: {
      checkout: true,
      products: true,
      cart_update: true,
      buyer_info_update: true,
      authorization_methods: ['ap2_mandate']
    },
    endpoints: {
      checkout: {
        create: `${UCP_BASE_URL}/api/v1/checkout-sessions`,
        retrieve: `${UCP_BASE_URL}/api/v1/checkout-sessions/{id}`,
        update: `${UCP_BASE_URL}/api/v1/checkout-sessions/{id}`,
        complete: `${UCP_BASE_URL}/api/v1/checkout-sessions/{id}/complete`,
        cancel: `${UCP_BASE_URL}/api/v1/checkout-sessions/{id}/cancel`
      },
      products: {
        list: `${UCP_BASE_URL}/api/v1/products`,
        retrieve: `${UCP_BASE_URL}/api/v1/products/{sku}`
      }
    },
    payment_handlers: [
      {
        type: 'stripe',
        supported_methods: ['card'],
        public_key: process.env.STRIPE_PUBLISHABLE_KEY || '',
        test_mode: true
      }
    ],
    authorization: {
      supported_methods: ['ap2_mandate'],
      ap2: {
        version: '1.0',
        mandate_types: ['cart_mandate'],
        signature_algorithms: ['mock']
      }
    },
    session: {
      default_ttl: 3600,
      max_ttl: 86400
    },
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  };

  res.json(ucpProfile);
});

export default router;
