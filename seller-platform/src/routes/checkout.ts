import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../db/store';
import { CartItem, CheckoutSession, Order } from '../types';
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
      const product = store.getProduct(item.sku);

      if (!product) {
        return res.status(404).json({ error: `Product ${item.sku} not found` });
      }

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

    const session: CheckoutSession = {
      id: sessionId,
      status: 'incomplete',
      items: enrichedItems,
      total_amount: total,
      subtotal,
      tax,
      currency: 'USD',
      continue_url: continue_url || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: expiresAt
    };

    store.createSession(session);

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

router.get('/checkout-sessions/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = store.getSession(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      id: session.id,
      status: session.status,
      items: session.items,
      buyer_info: session.buyer_info,
      shipping_address: session.shipping_address,
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

router.put('/checkout-sessions/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { buyer_info, shipping_address } = req.body;

    const session = store.getSession(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'incomplete') {
      return res.status(400).json({ error: 'Cannot update completed or canceled session' });
    }

    store.updateSession(id, {
      buyer_info,
      shipping_address
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

router.post('/checkout-sessions/:id/cancel', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = store.getSession(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    store.updateSession(id, { status: 'canceled' });

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

    const session = store.getSession(id);

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
      session.total_amount!,
      session.currency,
      payment_credential
    );

    const orderId = uuidv4();
    const buyerInfo = session.buyer_info || {};
    const shippingAddress = session.shipping_address;

    const order: Order = {
      id: orderId,
      checkout_session_id: id,
      customer_email: buyerInfo.email || 'unknown@example.com',
      customer_name: buyerInfo.name,
      items: session.items,
      total_amount: session.total_amount!,
      currency: session.currency,
      payment_status: 'succeeded',
      fulfillment_status: 'pending',
      stripe_payment_intent_id: paymentIntentId,
      shipping_address: shippingAddress,
      created_at: new Date().toISOString()
    };

    store.createOrder(order);

    store.updateSession(id, {
      status: 'complete',
      ap2_mandate,
      payment_credential,
      nonce: ap2_mandate.nonce
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
