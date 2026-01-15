export interface Product {
  sku: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url: string;
  inventory_count: number;
  is_active: number;
  created_at?: string;
  updated_at?: string;
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
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface CheckoutSession {
  id: string;
  status: 'incomplete' | 'complete' | 'canceled' | 'expired';
  items: CartItem[];
  buyer_info?: BuyerInfo;
  shipping_address?: ShippingAddress;
  total_amount?: number;
  subtotal?: number;
  tax?: number;
  currency: string;
  payment_credential?: any;
  ap2_mandate?: AP2Mandate;
  continue_url?: string;
  nonce?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface AP2Mandate {
  version: string;
  type: 'cart_mandate' | 'intent_mandate';
  merchant_id: string;
  session_id: string;
  amount: number;
  currency: string;
  timestamp: string;
  nonce: string;
  signature?: string;
}

export interface Order {
  id: string;
  checkout_session_id: string;
  customer_email: string;
  customer_name?: string;
  items: CartItem[];
  total_amount: number;
  currency: string;
  payment_status: string;
  fulfillment_status: string;
  stripe_payment_intent_id?: string;
  shipping_address?: ShippingAddress;
  created_at: string;
}
