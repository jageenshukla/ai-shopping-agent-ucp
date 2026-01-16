import {type Context} from 'hono';
import {listProducts, getProduct} from '../data/products';

/**
 * ProductsService handles product catalog operations.
 * This is a merchant-specific extension to demonstrate UCP extensibility.
 */
export class ProductsService {
  /**
   * GET /products - List all products
   */
  listProducts = (c: Context) => {
    const products = listProducts();

    // Transform to format compatible with buyer agent
    const formattedProducts = products.map(p => ({
      sku: p.id,
      name: p.title,
      description: `${p.title} from our curated collection`,
      price: p.price / 100, // Convert cents to dollars
      currency: 'USD',
      in_stock: true,
      image_url: p.image_url,
    }));

    return c.json(formattedProducts);
  };

  /**
   * GET /products/:id - Get a single product
   */
  getProduct = (c: Context) => {
    const productId = c.req.param('id');
    const product = getProduct(productId);

    if (!product) {
      return c.json({error: 'Product not found'}, 404);
    }

    // Transform to format compatible with buyer agent
    const formattedProduct = {
      sku: product.id,
      name: product.title,
      description: `${product.title} from our curated collection`,
      price: product.price / 100, // Convert cents to dollars
      currency: 'USD',
      in_stock: true,
      image_url: product.image_url,
    };

    return c.json(formattedProduct);
  };
}
