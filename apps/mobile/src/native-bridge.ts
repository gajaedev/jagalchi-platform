export const NATIVE_ACTIONS = [
  'oauth',
  'share',
  'download',
  'pick-file',
  'notification-permission',
  'products',
  'purchase',
  'restore-purchases',
] as const;

export type NativeAction = (typeof NATIVE_ACTIONS)[number];

export const STORE_PRODUCT_IDS = [
  'com.jagalchi.app.ticket20',
  'com.jagalchi.app.ticket60',
  'com.jagalchi.app.ticket150',
] as const;
export type StoreProductId = (typeof STORE_PRODUCT_IDS)[number];

type RequestBase = {
  id: string;
  action: NativeAction;
};

export type NativeRequest =
  | (RequestBase & {
      action: 'oauth';
      authorizationUrl: string;
      callbackUrl?: string;
    })
  | (RequestBase & {
      action: 'share';
      url: string;
      title?: string;
    })
  | (RequestBase & {
      action: 'download';
      url: string;
      fileName?: string;
    })
  | (RequestBase & { action: 'pick-file' })
  | (RequestBase & { action: 'notification-permission' })
  | (RequestBase & { action: 'products' })
  | (RequestBase & {
      action: 'purchase';
      productId: StoreProductId;
      accessToken: string;
      appleAppAccountToken: string;
      googleObfuscatedAccountId: string;
    })
  | (RequestBase & { action: 'restore-purchases'; accessToken: string });

export type NativeResult =
  | {
      id: string;
      action: 'oauth';
      ok: true;
      callbackUrl: string;
    }
  | {
      id: string;
      action: 'share';
      ok: true;
      completed: boolean;
    }
  | {
      id: string;
      action: 'download';
      ok: true;
      uri: string;
    }
  | {
      id: string;
      action: 'pick-file';
      ok: true;
      completed: boolean;
      file?: {
        name: string;
        mimeType: string;
        size: number;
        base64: string;
      };
    }
  | {
      id: string;
      action: 'notification-permission';
      ok: true;
      granted: boolean;
      status: string;
    }
  | {
      id: string;
      action: 'products';
      ok: true;
      products: Array<{
        productId: StoreProductId;
        title: string;
        displayPrice: string;
      }>;
    }
  | {
      id: string;
      action: 'purchase';
      ok: true;
      state: 'fulfilled' | 'already-fulfilled' | 'pending';
      productId: StoreProductId;
      purchaseId?: string;
      tickets?: number;
      balance?: number;
    }
  | {
      id: string;
      action: 'restore-purchases';
      ok: true;
      state: 'restored';
      items: Array<{
        productId: StoreProductId;
        state: 'fulfilled' | 'already-fulfilled' | 'pending';
        tickets?: number;
        errorCode?: string;
      }>;
      balance?: number;
    }
  | {
      id: string;
      action: NativeAction;
      ok: false;
      error: {
        code:
          | 'cancelled'
          | 'auth-required'
          | 'invalid-request'
          | 'not-allowed'
          | 'unsupported'
          | 'item-unavailable'
          | 'store-unavailable'
          | 'network-error'
          | 'verification-failed'
          | 'finish-failed'
          | 'recovery-required'
          | 'native-error';
        message: string;
        retryable: boolean;
      };
      items?: Array<{
        productId: StoreProductId;
        state: 'fulfilled' | 'already-fulfilled' | 'pending' | 'failed';
        tickets?: number;
        errorCode?: string;
      }>;
      balance?: number;
    };

const MAX_MESSAGE_LENGTH = 32_768;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const STORE_PRODUCT_ID_SET = new Set<string>(STORE_PRODUCT_IDS);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/i;
const FILE_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._ -]{0,127}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  required: string[],
  optional: string[] = [],
): boolean {
  const keys = Object.keys(value);
  const allowed = new Set([...required, ...optional]);
  return (
    required.every((key) => Object.hasOwn(value, key)) && keys.every((key) => allowed.has(key))
  );
}

function isString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength;
}

function isOptionalString(value: unknown, maxLength: number): value is string | undefined {
  return value === undefined || isString(value, maxLength);
}

function isWebUrl(value: unknown, allowHttp = true): value is string {
  if (!isString(value, 4_096)) return false;

  try {
    const url = new URL(value);
    return (
      url.username === '' &&
      url.password === '' &&
      (url.protocol === 'https:' || (allowHttp && url.protocol === 'http:'))
    );
  } catch {
    return false;
  }
}

function isCallbackUrl(value: unknown): value is string {
  if (!isString(value, 4_096)) return false;

  try {
    const url = new URL(value);
    return (
      url.username === '' &&
      url.password === '' &&
      ['https:', 'http:', 'jagalchi:'].includes(url.protocol)
    );
  } catch {
    return false;
  }
}

export function createRequestId(): string {
  const randomPart = Math.random().toString(36).slice(2);
  return `native-${Date.now().toString(36)}-${randomPart}`;
}

export function parseNativeRequest(raw: unknown): NativeRequest | null {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > MAX_MESSAGE_LENGTH) return null;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }

  if (
    !isRecord(value) ||
    !isString(value.id, 128) ||
    !ID_PATTERN.test(value.id) ||
    typeof value.action !== 'string'
  ) {
    return null;
  }

  switch (value.action) {
    case 'oauth':
      if (
        !hasOnlyKeys(value, ['id', 'action', 'authorizationUrl'], ['callbackUrl']) ||
        !isWebUrl(value.authorizationUrl) ||
        !isOptionalString(value.callbackUrl, 4_096) ||
        (value.callbackUrl !== undefined && !isCallbackUrl(value.callbackUrl))
      ) {
        return null;
      }
      return value as NativeRequest;

    case 'share':
      if (
        !hasOnlyKeys(value, ['id', 'action', 'url'], ['title']) ||
        !isWebUrl(value.url) ||
        !isOptionalString(value.title, 200)
      ) {
        return null;
      }
      return value as NativeRequest;

    case 'download':
      if (
        !hasOnlyKeys(value, ['id', 'action', 'url'], ['fileName']) ||
        !isWebUrl(value.url) ||
        !isOptionalString(value.fileName, 128) ||
        (value.fileName !== undefined && !FILE_NAME_PATTERN.test(value.fileName))
      ) {
        return null;
      }
      return value as NativeRequest;

    case 'notification-permission':
      return hasOnlyKeys(value, ['id', 'action']) ? (value as NativeRequest) : null;

    case 'pick-file':
      return hasOnlyKeys(value, ['id', 'action']) ? (value as NativeRequest) : null;

    case 'products':
      return hasOnlyKeys(value, ['id', 'action']) ? (value as NativeRequest) : null;

    case 'purchase':
      if (
        !hasOnlyKeys(value, [
          'id',
          'action',
          'productId',
          'accessToken',
          'appleAppAccountToken',
          'googleObfuscatedAccountId',
        ]) ||
        !isString(value.productId, 128) ||
        !STORE_PRODUCT_ID_SET.has(value.productId) ||
        !isString(value.accessToken, 8_192) ||
        !isString(value.appleAppAccountToken, 36) ||
        !UUID_PATTERN.test(value.appleAppAccountToken) ||
        !isString(value.googleObfuscatedAccountId, 64) ||
        !SHA256_HEX_PATTERN.test(value.googleObfuscatedAccountId)
      ) {
        return null;
      }
      return value as NativeRequest;

    case 'restore-purchases':
      if (
        !hasOnlyKeys(value, ['id', 'action', 'accessToken']) ||
        !isString(value.accessToken, 8_192)
      ) {
        return null;
      }
      return value as NativeRequest;

    default:
      return null;
  }
}

export function errorResult(
  request: NativeRequest,
  code: Extract<NativeResult, { ok: false }>['error']['code'],
  message: string,
  retryable = false,
  partial?: Pick<Extract<NativeResult, { ok: false }>, 'items' | 'balance'>,
): NativeResult {
  return {
    id: request.id,
    action: request.action,
    ok: false,
    error: { code, message, retryable },
    ...partial,
  };
}
