import axios from 'axios';
import { UCPProfile } from '../types/index.js';

export async function discoverMerchant(merchantUrl: string): Promise<UCPProfile> {
  try {
    const ucpUrl = `${merchantUrl}/.well-known/ucp`;
    console.log(`Discovering UCP profile at: ${ucpUrl}`);

    const response = await axios.get<UCPProfile>(ucpUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'UCP-Buyer-Agent/1.0'
      },
      timeout: 10000
    });

    return response.data;
  } catch (error: any) {
    console.error('Discovery failed:', error.message);
    throw new Error(`Failed to discover merchant: ${error.message}`);
  }
}

export function hasCheckoutCapability(profile: UCPProfile): boolean {
  return profile.ucp?.capabilities?.some(cap => cap.name?.includes('checkout')) ?? false;
}

export function hasProductsCapability(profile: UCPProfile): boolean {
  // Products are a merchant extension, not in core UCP spec
  return true; // Assume supported if they provide the endpoint
}

export function supportsAP2Authorization(profile: UCPProfile): boolean {
  // Check payment handlers for AP2 support
  return profile.payment?.handlers?.some(h => h.name?.includes('ap2')) ?? false;
}
