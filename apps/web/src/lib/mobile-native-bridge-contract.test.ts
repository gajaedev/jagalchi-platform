import { describe, expect, it } from 'vitest';

import { parseNativeRequest, STORE_PRODUCT_IDS } from '../../../mobile/src/native-bridge';

const bindings = {
  accessToken: 'access-token-value',
  appleAppAccountToken: '00000000-0000-4000-8000-000000000001',
  googleObfuscatedAccountId: 'a'.repeat(64),
};

describe('mobile native commerce request contract', () => {
  it.each(STORE_PRODUCT_IDS)('accepts only the approved store product %s', (productId) => {
    expect(
      parseNativeRequest(
        JSON.stringify({
          id: 'purchase-1',
          action: 'purchase',
          productId,
          ...bindings,
        }),
      ),
    ).toMatchObject({ action: 'purchase', productId });
  });

  it('rejects arbitrary product ids and malformed account bindings', () => {
    expect(
      parseNativeRequest(
        JSON.stringify({
          id: 'purchase-1',
          action: 'purchase',
          productId: 'com.attacker.ticket9999',
          ...bindings,
        }),
      ),
    ).toBeNull();
    expect(
      parseNativeRequest(
        JSON.stringify({
          id: 'purchase-1',
          action: 'purchase',
          productId: STORE_PRODUCT_IDS[0],
          ...bindings,
          googleObfuscatedAccountId: 'raw-user-id',
        }),
      ),
    ).toBeNull();
  });

  it('requires authentication for restore and no proof-finishing web action exists', () => {
    expect(
      parseNativeRequest(
        JSON.stringify({
          id: 'restore-1',
          action: 'restore-purchases',
          accessToken: 'access-token-value',
        }),
      ),
    ).toMatchObject({ action: 'restore-purchases' });
    expect(
      parseNativeRequest(JSON.stringify({ id: 'restore-1', action: 'restore-purchases' })),
    ).toBeNull();
    expect(
      parseNativeRequest(
        JSON.stringify({ id: 'finish-1', action: 'finish-purchase', transactionId: 'x' }),
      ),
    ).toBeNull();
  });
});
