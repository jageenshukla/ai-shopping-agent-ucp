// Import official UCP SDK types and schemas
import * as UCP from '@ucp-js/sdk';

// Re-export UCP SDK types
export { UCP };

// Custom types not in UCP spec - matches actual UCP discovery response
export interface UCPProfile {
  ucp: {
    version: string;
    services: any;
    capabilities: any[];
  };
  payment?: {
    handlers: any[];
  };
}

export interface Product {
  sku: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  image_url?: string;
  is_active: number;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  sku: string;
  quantity: number;
  price?: number;
  name?: string;
}

export interface BuyerInfo {
  email: string;
  name?: string;
  phone?: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface CheckoutSession {
  id: string;
  status: 'incomplete' | 'complete' | 'canceled';
  line_items: any[];  // UCP line items from seller
  items: CartItem[];  // Simplified cart items for backward compatibility
  buyer_info?: BuyerInfo;
  shipping_address?: ShippingAddress;
  subtotal?: number;
  tax?: number;
  total_amount: number;
  currency: string;
  continue_url?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface AP2Mandate {
  version: string;
  type: 'cart_mandate';
  nonce: string;
  timestamp: string;
  issuer: {
    agent_id: string;
    agent_name: string;
  };
  payload: {
    merchant_id: string;
    checkout_session_id: string;
    items: Array<{
      sku: string;
      quantity: number;
      price: number;
    }>;
    total_amount: number;
    currency: string;
  };
  signature: {
    algorithm: 'mock';
    value: string;
  };
}

export interface PaymentCredential {
  type: 'mock_payment';
  token: string;
  last4?: string;
}
