import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/init';
import { CartItem, CheckoutSession, Product, BuyerInfo, ShippingAddress, Order } from '../types';
import { validateAP2Mandate } from '../services/ap2';
import { createPaymentIntent } from '../services/stripe';

const router = Router();

const TAX_RATE = 0.08;

router.post('/checkout-sessions', async (req: Request, res: Response) => {
  try {
    const { items, continue_url } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    const sessionId = uuidv4();
    const enrichedItems: CartItem[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await new Promise<Product>((resolve, reject) => {
        db.get<Product>(
          'SELECT * FROM products WHERE sku = ? AND is_active = 1',
          [item.sku],
          (err, row) => {
            if (err) reject(err);
            else if (!row) reject(new Error(`Product ${item.sku} not found`));
            else resolve(row);
          }
        );
      });

      enrichedItems.push({
        sku: product.sku,
        quantity: item.quantity,
        price: product.price,
        name: product.name
      });

      subtotal += product.price * item.quantity;
    }

    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    await new Promise<void>((resolve, reject) => {
      db.run(
        `INSERT INTO checkout_sessions (
          id, status, items, total_amount, subtotal, tax, currency,
          continue_url, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          'incomplete',
          JSON.stringify(enrichedItems),
          total,
          subtotal,
          tax,
          'USD',
          continue_url || null,
          expiresAt
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.status(201).json({
      id: sessionId,
      status: 'incomplete',
      items: enrichedItems,
      subtotal,
      tax,
      total_amount: total,
      currency: 'USD',
      expires_at: expiresAt,
      continue_url
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.get('/checkout-sessions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const session = await new Promise<any>((resolve, reject) => {
      db.get(
        'SELECT * FROM checkout_sessions WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      id: session.id,
      status: session.status,
      items: JSON.parse(session.items),
      buyer_info: session.buyer_info ? JSON.parse(session.buyer_info) : undefined,
      shipping_address: session.shipping_address ? JSON.parse(session.shipping_address) : undefined,
      subtotal: session.subtotal,
      tax: session.tax,
      total_amount: session.total_amount,
      currency: session.currency,
      continue_url: session.continue_url,
      created_at: session.created_at,
      updated_at: session.updated_at,
      expires_at: session.expires_at
    });
  } catch (error: any) {
    console.error('Error retrieving checkout session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/checkout-sessions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { buyer_info, shipping_address } = req.body;

    const session = await new Promise<any>((resolve, reject) => {
      db.get(
        'SELECT * FROM checkout_sessions WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'incomplete') {
      return res.status(400).json({ error: 'Cannot update completed or canceled session' });
    }

    await new Promise<void>((resolve, reject) => {
      db.run(
        `UPDATE checkout_sessions
         SET buyer_info = ?, shipping_address = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          buyer_info ? JSON.stringify(buyer_info) : null,
          shipping_address ? JSON.stringify(shipping_address) : null,
          id
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({
      id,
      status: session.status,
      message: 'Session updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating checkout session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/checkout-sessions/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const session = await new Promise<any>((resolve, reject) => {
      db.get(
        'SELECT * FROM checkout_sessions WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await new Promise<void>((resolve, reject) => {
      db.run(
        'UPDATE checkout_sessions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['canceled', id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({
      id,
      status: 'canceled',
      message: 'Session canceled successfully'
    });
  } catch (error: any) {
    console.error('Error canceling checkout session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/checkout-sessions/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ap2_mandate, payment_credential } = req.body;

    const session = await new Promise<any>((resolve, reject) => {
      db.get(
        'SELECT * FROM checkout_sessions WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'incomplete') {
      return res.status(400).json({ error: 'Session is not in incomplete status' });
    }

    const validationResult = await validateAP2Mandate(ap2_mandate, session);
    if (!validationResult.valid) {
      return res.status(400).json({ error: validationResult.error });
    }

    const paymentIntentId = await createPaymentIntent(
      session.total_amount,
      session.currency,
      payment_credential
    );

    const orderId = uuidv4();
    const buyerInfo = session.buyer_info ? JSON.parse(session.buyer_info) : {};
    const shippingAddress = session.shipping_address ? JSON.parse(session.shipping_address) : null;

    await new Promise<void>((resolve, reject) => {
      db.run(
        `INSERT INTO orders (
          id, checkout_session_id, customer_email, customer_name,
          items, total_amount, currency, payment_status,
          fulfillment_status, stripe_payment_intent_id, shipping_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          id,
          buyerInfo.email || 'unknown@example.com',
          buyerInfo.name || null,
          session.items,
          session.total_amount,
          session.currency,
          'succeeded',
          'pending',
          paymentIntentId,
          shippingAddress ? JSON.stringify(shippingAddress) : null
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    await new Promise<void>((resolve, reject) => {
      db.run(
        `UPDATE checkout_sessions
         SET status = ?, ap2_mandate = ?, payment_credential = ?, nonce = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          'complete',
          JSON.stringify(ap2_mandate),
          JSON.stringify(payment_credential),
          ap2_mandate.nonce,
          id
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({
      id,
      status: 'complete',
      order_id: orderId,
      message: 'Checkout completed successfully'
    });
  } catch (error: any) {
    console.error('Error completing checkout:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
