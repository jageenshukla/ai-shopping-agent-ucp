import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY not set. Payment processing will be simulated.');
}

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' })
  : null;

export async function createPaymentIntent(
  amount: number,
  currency: string,
  paymentCredential: any
): Promise<string> {
  if (!stripe) {
    console.log('Stripe not configured, simulating payment...');
    return `pi_mock_${Date.now()}`;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      payment_method_types: ['card'],
      confirm: false,
      metadata: {
        source: 'ucp_seller_platform'
      }
    });

    console.log(`Payment Intent created: ${paymentIntent.id}`);
    return paymentIntent.id;
  } catch (error: any) {
    console.error('Stripe payment error:', error.message);

    console.log('Falling back to mock payment...');
    return `pi_mock_${Date.now()}`;
  }
}
