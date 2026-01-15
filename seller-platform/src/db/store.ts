import { Product, CheckoutSession, Order } from '../types';

// In-memory data stores
export const products = new Map<string, Product>();
export const checkoutSessions = new Map<string, CheckoutSession>();
export const orders = new Map<string, Order>();
export const usedNonces = new Set<string>();

// Helper functions for in-memory operations
export const store = {
  // Products
  getProduct: (sku: string): Product | undefined => {
    return products.get(sku);
  },

  getAllProducts: (): Product[] => {
    return Array.from(products.values()).filter(p => p.is_active === 1);
  },

  addProduct: (product: Product): void => {
    products.set(product.sku, product);
  },

  // Checkout Sessions
  getSession: (id: string): CheckoutSession | undefined => {
    return checkoutSessions.get(id);
  },

  createSession: (session: CheckoutSession): void => {
    checkoutSessions.set(session.id, session);
  },

  updateSession: (id: string, updates: Partial<CheckoutSession>): void => {
    const session = checkoutSessions.get(id);
    if (session) {
      checkoutSessions.set(id, { ...session, ...updates, updated_at: new Date().toISOString() });
    }
  },

  // Orders
  getOrder: (id: string): Order | undefined => {
    return orders.get(id);
  },

  createOrder: (order: Order): void => {
    orders.set(order.id, order);
  },

  getAllOrders: (): Order[] => {
    return Array.from(orders.values());
  },

  // Nonces (for replay protection)
  hasNonce: (nonce: string): boolean => {
    return usedNonces.has(nonce);
  },

  addNonce: (nonce: string): void => {
    usedNonces.add(nonce);
  },

  // Utility
  reset: (): void => {
    products.clear();
    checkoutSessions.clear();
    orders.clear();
    usedNonces.clear();
  },

  getStats: () => ({
    products: products.size,
    sessions: checkoutSessions.size,
    orders: orders.size,
    nonces: usedNonces.size
  })
};
