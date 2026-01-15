import { Router, Request, Response } from 'express';
import db from '../db/init';
import { Product } from '../types';

const router = Router();

router.get('/products', async (req: Request, res: Response) => {
  try {
    const products = await new Promise<Product[]>((resolve, reject) => {
      db.all<Product>(
        'SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC',
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    res.json({
      products,
      count: products.length
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/products/:sku', async (req: Request, res: Response) => {
  try {
    const { sku } = req.params;

    const product = await new Promise<Product>((resolve, reject) => {
      db.get<Product>(
        'SELECT * FROM products WHERE sku = ? AND is_active = 1',
        [sku],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error: any) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
