import axios, { AxiosInstance } from 'axios';
import { Product, UCP } from '../types/index.js';

/**
 * UCP Products Client using official @ucp-js/sdk
 *
 * This client interacts with merchant-specific product endpoints.
 * Note: Products are not part of core UCP v1 spec, which focuses on checkout/post-purchase.
 * This demonstrates UCP extensibility for merchant-specific capabilities.
 *
 * @see https://ucp.dev/specification/overview/extensibility/
 * @see https://github.com/Universal-Commerce-Protocol/js-sdk
 */
export class UCPProductsClient {
  private axios: AxiosInstance;

  constructor(private baseUrl: string) {
    this.axios = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * List all available products from the merchant
   * This is a merchant-specific extension endpoint
   */
  async listProducts(): Promise<Product[]> {
    try {
      console.log('[UCP SDK] Fetching products from merchant');

      const response = await this.axios.get<Product[]>('/products');

      console.log(`[UCP SDK] Retrieved ${response.data.length} products`);
      return response.data;
    } catch (error: any) {
      console.error('[UCP SDK] Failed to list products:', error.message);
      throw new Error(`Failed to list products: ${error.message}`);
    }
  }

  /**
   * Get a specific product by SKU
   */
  async getProduct(sku: string): Promise<Product> {
    try {
      console.log('[UCP SDK] Fetching product:', sku);

      const response = await this.axios.get<Product>(`/products/${sku}`);

      console.log('[UCP SDK] Product retrieved:', response.data.name);
      return response.data;
    } catch (error: any) {
      console.error('[UCP SDK] Failed to get product:', error.message);
      throw new Error(`Failed to get product: ${error.message}`);
    }
  }

  /**
   * Search products by query (client-side filtering)
   * In production, this would typically be a server-side search endpoint
   */
  searchProducts(products: Product[], query: string): Product[] {
    console.log('[UCP SDK] Searching products for:', query);

    const lowerQuery = query.toLowerCase();
    const results = products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery)
    );

    console.log(`[UCP SDK] Found ${results.length} matching products`);
    return results;
  }

  /**
   * Check if product is in stock
   */
  isInStock(product: Product): boolean {
    // Our Product interface uses stock_quantity
    return product.stock_quantity > 0;
  }

  /**
   * Format price for display
   */
  formatPrice(product: Product): string {
    return `${product.currency} ${product.price.toFixed(2)}`;
  }
}
