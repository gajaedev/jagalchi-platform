import { Platform } from 'react-native';

import type { StoreProductId } from './native-bridge';
import type { Purchase } from 'expo-iap';

export type TicketPurchaseFulfillment = {
  status: 'fulfilled' | 'already-fulfilled';
  purchaseId: string;
  productId: StoreProductId;
  tickets: number;
  balance: number;
};

export class PurchaseApiError extends Error {
  constructor(
    message: string,
    readonly code: 'auth-required' | 'network-error' | 'verification-failed' | 'finish-failed',
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

const LOCAL_API_URL = Platform.select({
  android: 'http://10.0.2.2:8082/api',
  default: 'http://localhost:8082/api',
})!;

function getApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  const development = process.env.NODE_ENV !== 'production';
  if (!configured) return development ? LOCAL_API_URL : '';
  try {
    const url = new URL(configured);
    if (url.username || url.password || !['https:', 'http:'].includes(url.protocol)) {
      return LOCAL_API_URL;
    }
    if (!development && url.protocol !== 'https:') return '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return development ? LOCAL_API_URL : '';
  }
}

export async function fulfillTicketPurchase(
  purchase: Purchase,
  accessToken: string,
): Promise<TicketPurchaseFulfillment> {
  if (!purchase.purchaseToken) {
    throw new PurchaseApiError('스토어 구매 증명이 없습니다.', 'verification-failed', false);
  }
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    throw new PurchaseApiError(
      '안전한 구매 확인 서버가 설정되지 않았습니다.',
      'network-error',
      false,
    );
  }
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/tickets/purchases/fulfill`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        Platform.OS === 'ios'
          ? { store: 'apple', signedTransactionInfo: purchase.purchaseToken }
          : { store: 'google', purchaseToken: purchase.purchaseToken },
      ),
    });
  } catch {
    throw new PurchaseApiError('구매 확인 서버에 연결할 수 없습니다.', 'network-error', true);
  }
  if (response.status === 401 || response.status === 403) {
    throw new PurchaseApiError('로그인이 만료되었습니다.', 'auth-required', false);
  }
  if (!response.ok) {
    throw new PurchaseApiError(
      response.status >= 500
        ? '구매 확인이 지연되고 있습니다. 복원에서 다시 확인해 주세요.'
        : '스토어 구매를 확인하지 못했습니다.',
      response.status >= 500 ? 'network-error' : 'verification-failed',
      response.status >= 500,
    );
  }
  const value = (await response.json()) as TicketPurchaseFulfillment;
  if (
    !['fulfilled', 'already-fulfilled'].includes(value.status) ||
    typeof value.purchaseId !== 'string' ||
    typeof value.productId !== 'string' ||
    typeof value.tickets !== 'number' ||
    typeof value.balance !== 'number'
  ) {
    throw new PurchaseApiError('구매 확인 응답이 올바르지 않습니다.', 'network-error', true);
  }
  return value;
}
