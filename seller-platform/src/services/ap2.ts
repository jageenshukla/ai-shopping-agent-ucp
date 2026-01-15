import { store } from '../db/store';
import { AP2Mandate, CheckoutSession } from '../types';

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export async function validateAP2Mandate(
  mandate: AP2Mandate,
  session: CheckoutSession
): Promise<ValidationResult> {
  if (!mandate) {
    return { valid: false, error: 'AP2 mandate is required' };
  }

  if (!mandate.version || mandate.version !== '1.0') {
    return { valid: false, error: 'Invalid AP2 mandate version' };
  }

  if (!mandate.type || mandate.type !== 'cart_mandate') {
    return { valid: false, error: 'Only cart_mandate type is supported' };
  }

  if (mandate.session_id !== session.id) {
    return { valid: false, error: 'Mandate session ID does not match' };
  }

  if (Math.abs(mandate.amount - (session.total_amount || 0)) > 0.01) {
    return { valid: false, error: 'Mandate amount does not match session total' };
  }

  if (mandate.currency !== session.currency) {
    return { valid: false, error: 'Mandate currency does not match session currency' };
  }

  const mandateTimestamp = new Date(mandate.timestamp).getTime();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  if (Math.abs(now - mandateTimestamp) > fiveMinutes) {
    return { valid: false, error: 'Mandate timestamp is too old or in the future' };
  }

  if (!mandate.nonce || mandate.nonce.length < 16) {
    return { valid: false, error: 'Invalid mandate nonce' };
  }

  if (store.hasNonce(mandate.nonce)) {
    return { valid: false, error: 'Mandate nonce has already been used (replay attack)' };
  }

  store.addNonce(mandate.nonce);

  console.log('AP2 mandate validation passed (mock signature validation)');

  return { valid: true };
}
