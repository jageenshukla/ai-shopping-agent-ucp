import { Router, Request, Response } from 'express';
import { store } from '../db/store';

const router = Router();

router.get('/products', (req: Request, res: Response) => {
  try {
    const products = store.getAllProducts();

    res.json({
      products,
      count: products.length
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/products/:sku', (req: Request, res: Response) => {
  try {
    const { sku } = req.params;
    const product = store.getProduct(sku);

    if (!product || product.is_active !== 1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error: any) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
