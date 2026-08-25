import {
  endConnection,
  ErrorCode,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
  type Purchase,
} from 'expo-iap';
import { Platform } from 'react-native';

import { STORE_PRODUCT_IDS, type StoreProductId } from './native-bridge';

const STORE_PRODUCT_SET = new Set<string>(STORE_PRODUCT_IDS);

export type TicketStoreProduct = {
  productId: StoreProductId;
  title: string;
  displayPrice: string;
};
export type IapPurchaseError = Parameters<Parameters<typeof purchaseErrorListener>[0]>[0];

export async function initializeIap(
  onPurchase: (purchase: Purchase) => void,
  onError: (error: IapPurchaseError) => void,
): Promise<() => Promise<void>> {
  const purchaseSubscription = purchaseUpdatedListener(onPurchase);
  const errorSubscription = purchaseErrorListener(onError);
  try {
    const connected = await initConnection();
    if (!connected) throw new Error('스토어에 연결할 수 없습니다.');
  } catch (error) {
    purchaseSubscription.remove();
    errorSubscription.remove();
    throw error;
  }
  return async () => {
    purchaseSubscription.remove();
    errorSubscription.remove();
    await endConnection();
  };
}

export async function listTicketProducts(): Promise<TicketStoreProduct[]> {
  const products = await fetchProducts({ skus: [...STORE_PRODUCT_IDS], type: 'in-app' });
  if (!products) return [];
  return products.flatMap((product) => {
    if (!STORE_PRODUCT_SET.has(product.id)) return [];
    return [
      {
        productId: product.id as StoreProductId,
        title: product.title,
        displayPrice: product.displayPrice,
      },
    ];
  });
}

export async function requestTicketPurchase(input: {
  productId: StoreProductId;
  appleAppAccountToken: string;
  googleObfuscatedAccountId: string;
}): Promise<void> {
  await requestPurchase({
    type: 'in-app',
    request: {
      apple: {
        sku: input.productId,
        appAccountToken: input.appleAppAccountToken,
        quantity: 1,
      },
      google: {
        skus: [input.productId],
        obfuscatedAccountId: input.googleObfuscatedAccountId,
      },
    },
  });
}

export async function recoverTicketPurchases(): Promise<Purchase[]> {
  if (Platform.OS === 'ios') await restorePurchases();
  return getAvailablePurchases({
    alsoPublishToEventListenerIOS: false,
    onlyIncludeActiveItemsIOS: true,
  });
}

export async function finishTicketPurchase(purchase: Purchase): Promise<void> {
  await finishTransaction({ purchase, isConsumable: true });
}

export function mapPurchaseError(error: IapPurchaseError): {
  code:
    | 'cancelled'
    | 'item-unavailable'
    | 'store-unavailable'
    | 'network-error'
    | 'pending'
    | 'recovery-required'
    | 'native-error';
  retryable: boolean;
} {
  const code = error.code ?? ErrorCode.Unknown;
  if (code === ErrorCode.UserCancelled) {
    return { code: 'cancelled', retryable: false };
  }
  if (code === ErrorCode.ItemUnavailable || code === ErrorCode.SkuNotFound) {
    return { code: 'item-unavailable', retryable: false };
  }
  if (code === ErrorCode.AlreadyOwned) {
    return { code: 'recovery-required', retryable: true };
  }
  if (code === ErrorCode.Pending || code === ErrorCode.DeferredPayment) {
    return { code: 'pending', retryable: true };
  }
  if (
    code === ErrorCode.BillingUnavailable ||
    code === ErrorCode.IapNotAvailable ||
    code === ErrorCode.FeatureNotSupported ||
    code === ErrorCode.NotPrepared
  ) {
    return { code: 'store-unavailable', retryable: true };
  }
  if (
    code === ErrorCode.NetworkError ||
    code === ErrorCode.ServiceDisconnected ||
    code === ErrorCode.ServiceError ||
    code === ErrorCode.ServiceTimeout
  ) {
    return { code: 'network-error', retryable: true };
  }
  return { code: 'native-error', retryable: true };
}
