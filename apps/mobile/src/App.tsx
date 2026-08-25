import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { registerRootComponent } from 'expo';
import * as AuthSession from 'expo-auth-session';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import WebView, {
  type WebViewMessageEvent,
  type WebViewNavigation,
  type WebViewProps,
} from 'react-native-webview';

import {
  finishTicketPurchase,
  initializeIap,
  listTicketProducts,
  mapPurchaseError,
  recoverTicketPurchases,
  requestTicketPurchase,
  type IapPurchaseError,
} from './iap';
import {
  errorResult,
  parseNativeRequest,
  STORE_PRODUCT_IDS,
  type NativeRequest,
  type NativeResult,
} from './native-bridge';
import { fulfillTicketPurchase, PurchaseApiError } from './purchase-api';

import type { Purchase } from 'expo-iap';

type WebViewErrorEvent = Parameters<NonNullable<WebViewProps['onError']>>[0];
type WebViewHttpErrorEvent = Parameters<NonNullable<WebViewProps['onHttpError']>>[0];

WebBrowser.maybeCompleteAuthSession();

const LOCAL_WEB_URL = Platform.select({
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
})!;
const OAUTH_CALLBACK_PATHS = new Set(['/auth/callback', '/oauth/callback']);
const MAX_PICKED_FILE_SIZE = 5 * 1024 * 1024;

function getWebUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_WEB_URL?.trim();
  if (!configuredUrl) return LOCAL_WEB_URL;

  try {
    const url = new URL(configuredUrl);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password)
      return LOCAL_WEB_URL;
    return url.toString();
  } catch {
    return LOCAL_WEB_URL;
  }
}

const WEB_URL = getWebUrl();
const WEB_ORIGIN = new URL(WEB_URL).origin;

function isAppOrigin(rawUrl: string): boolean {
  try {
    return new URL(rawUrl).origin === WEB_ORIGIN;
  } catch {
    return false;
  }
}

function hasSameCallbackLocation(rawUrl: string, callbackUrl: string): boolean {
  try {
    const candidate = new URL(rawUrl);
    const expected = new URL(callbackUrl);
    return (
      candidate.protocol === expected.protocol &&
      candidate.host === expected.host &&
      candidate.pathname === expected.pathname
    );
  } catch {
    return false;
  }
}

function isOAuthCallback(rawUrl: string, generatedCallbackUrl?: string): boolean {
  if (generatedCallbackUrl && hasSameCallbackLocation(rawUrl, generatedCallbackUrl)) return true;

  try {
    const url = new URL(rawUrl);
    if (url.protocol === 'jagalchi:') {
      return url.hostname === 'oauth' && url.pathname === '/callback';
    }
    return url.origin === WEB_ORIGIN && OAUTH_CALLBACK_PATHS.has(url.pathname);
  } catch {
    return false;
  }
}

function isAllowedRemoteResource(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'https:' || url.origin === WEB_ORIGIN;
  } catch {
    return false;
  }
}

function isAllowedOAuthAuthorization(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'https:' || url.origin === WEB_ORIGIN;
  } catch {
    return false;
  }
}

function fileNameFromRequest(request: Extract<NativeRequest, { action: 'download' }>): string {
  if (request.fileName) return request.fileName;

  try {
    const lastSegment = new URL(request.url).pathname.split('/').filter(Boolean).at(-1);
    if (lastSegment && /^[A-Za-z0-9][A-Za-z0-9._ -]{0,127}$/.test(lastSegment)) return lastSegment;
  } catch {
    // The request parser has already validated this URL.
  }
  return `jagalchi-download-${Date.now()}`;
}

function AppShell() {
  const webViewRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);
  const pendingPurchaseRef = useRef<Extract<NativeRequest, { action: 'purchase' }> | undefined>(
    undefined,
  );
  const iapReadyRef = useRef(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';

  const callbackUrl = useMemo(
    () => AuthSession.makeRedirectUri({ scheme: 'jagalchi', path: 'oauth/callback' }),
    [],
  );

  const sendResult = useCallback((result: NativeResult) => {
    const serialized = JSON.stringify(result).replace(/</g, '\\u003c');
    webViewRef.current?.injectJavaScript(`
      (function () {
        var result = ${serialized};
        window.dispatchEvent(new CustomEvent("jagalchi:native-result", { detail: result }));
        window.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(result) }));
      })();
      true;
    `);
  }, []);

  const fulfillAndFinish = useCallback(async (purchase: Purchase, accessToken: string) => {
    const fulfillment = await fulfillTicketPurchase(purchase, accessToken);
    try {
      await finishTicketPurchase(purchase);
    } catch {
      throw new PurchaseApiError(
        '티켓은 지급됐지만 스토어 마무리에 실패했습니다. 구매 복원에서 다시 시도해 주세요.',
        'finish-failed',
        true,
      );
    }
    return fulfillment;
  }, []);

  const handlePurchaseUpdate = useCallback(
    async (purchase: Purchase) => {
      const request = pendingPurchaseRef.current;
      if (!request || purchase.productId !== request.productId) return;
      if (purchase.purchaseState === 'pending') {
        pendingPurchaseRef.current = undefined;
        sendResult({
          id: request.id,
          action: 'purchase',
          ok: true,
          state: 'pending',
          productId: request.productId,
        });
        return;
      }
      if (purchase.purchaseState !== 'purchased') return;
      try {
        const result = await fulfillAndFinish(purchase, request.accessToken);
        sendResult({
          id: request.id,
          action: 'purchase',
          ok: true,
          state: result.status,
          productId: request.productId,
          purchaseId: result.purchaseId,
          tickets: result.tickets,
          balance: result.balance,
        });
      } catch (error) {
        if (error instanceof PurchaseApiError) {
          sendResult(errorResult(request, error.code, error.message, error.retryable));
        } else {
          sendResult(
            errorResult(
              request,
              'finish-failed',
              '스토어 거래를 마무리하지 못했습니다. 구매 복원에서 다시 시도해 주세요.',
              true,
            ),
          );
        }
      } finally {
        pendingPurchaseRef.current = undefined;
      }
    },
    [fulfillAndFinish, sendResult],
  );

  const handlePurchaseError = useCallback(
    (error: IapPurchaseError) => {
      const request = pendingPurchaseRef.current;
      if (!request) return;
      const mapped = mapPurchaseError(error);
      pendingPurchaseRef.current = undefined;
      if (mapped.code === 'pending') {
        sendResult({
          id: request.id,
          action: 'purchase',
          ok: true,
          state: 'pending',
          productId: request.productId,
        });
        return;
      }
      sendResult(errorResult(request, mapped.code, error.message, mapped.retryable));
    },
    [sendResult],
  );

  useEffect(() => {
    let cleanup: (() => Promise<void>) | undefined;
    let disposed = false;
    void initializeIap(handlePurchaseUpdate, handlePurchaseError)
      .then((dispose) => {
        if (disposed) return dispose();
        cleanup = dispose;
        iapReadyRef.current = true;
      })
      .catch(() => {
        iapReadyRef.current = false;
      });
    return () => {
      disposed = true;
      iapReadyRef.current = false;
      if (cleanup) void cleanup();
    };
  }, [handlePurchaseError, handlePurchaseUpdate]);

  const handleNativeRequest = useCallback(
    async (request: NativeRequest) => {
      try {
        switch (request.action) {
          case 'oauth': {
            const returnUrl = request.callbackUrl ?? callbackUrl;
            if (!isAllowedOAuthAuthorization(request.authorizationUrl)) {
              sendResult(
                errorResult(request, 'not-allowed', '허용되지 않은 OAuth 시작 주소입니다.'),
              );
              return;
            }
            if (!isOAuthCallback(returnUrl, callbackUrl)) {
              sendResult(
                errorResult(request, 'not-allowed', '허용되지 않은 OAuth 콜백 주소입니다.'),
              );
              return;
            }

            const result = await WebBrowser.openAuthSessionAsync(
              request.authorizationUrl,
              returnUrl,
            );
            if (result.type !== 'success' || !('url' in result) || !result.url) {
              sendResult(errorResult(request, 'cancelled', '로그인이 취소되었습니다.'));
              return;
            }
            if (!isOAuthCallback(result.url, callbackUrl)) {
              sendResult(
                errorResult(request, 'not-allowed', 'OAuth 응답 주소를 신뢰할 수 없습니다.'),
              );
              return;
            }
            sendResult({ id: request.id, action: 'oauth', ok: true, callbackUrl: result.url });
            return;
          }

          case 'share': {
            if (!isAllowedRemoteResource(request.url)) {
              sendResult(errorResult(request, 'not-allowed', '공유 주소를 신뢰할 수 없습니다.'));
              return;
            }
            const result = await Share.share({
              message: request.url,
              url: request.url,
              title: request.title,
            });
            sendResult({
              id: request.id,
              action: 'share',
              ok: true,
              completed: result.action === Share.sharedAction,
            });
            return;
          }

          case 'download': {
            if (!isAllowedRemoteResource(request.url) || !FileSystem.cacheDirectory) {
              sendResult(
                errorResult(
                  request,
                  'not-allowed',
                  '다운로드 주소 또는 저장 위치를 사용할 수 없습니다.',
                ),
              );
              return;
            }
            const destination = `${FileSystem.cacheDirectory}${fileNameFromRequest(request)}`;
            const downloaded = await FileSystem.downloadAsync(request.url, destination);
            if (downloaded.status < 200 || downloaded.status >= 300) {
              sendResult(
                errorResult(
                  request,
                  'native-error',
                  `다운로드에 실패했습니다. (${downloaded.status})`,
                ),
              );
              return;
            }
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(downloaded.uri);
            }
            sendResult({ id: request.id, action: 'download', ok: true, uri: downloaded.uri });
            return;
          }

          case 'pick-file': {
            const picked = await DocumentPicker.getDocumentAsync({
              copyToCacheDirectory: true,
              multiple: false,
            });
            if (picked.canceled) {
              sendResult({
                id: request.id,
                action: 'pick-file',
                ok: true,
                completed: false,
              });
              return;
            }
            const asset = picked.assets[0];
            if (!asset || !asset.size || asset.size > MAX_PICKED_FILE_SIZE) {
              sendResult(
                errorResult(request, 'invalid-request', '파일은 5MB 이하만 선택할 수 있습니다.'),
              );
              return;
            }
            const base64 = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            sendResult({
              id: request.id,
              action: 'pick-file',
              ok: true,
              completed: true,
              file: {
                name: asset.name,
                mimeType: asset.mimeType ?? 'application/octet-stream',
                size: asset.size,
                base64,
              },
            });
            return;
          }

          case 'notification-permission': {
            let permission = await Notifications.getPermissionsAsync();
            if (permission.status === 'undetermined')
              permission = await Notifications.requestPermissionsAsync();
            sendResult({
              id: request.id,
              action: 'notification-permission',
              ok: true,
              granted: permission.granted,
              status: permission.status,
            });
            return;
          }

          case 'products': {
            if (!iapReadyRef.current) {
              sendResult(
                errorResult(
                  request,
                  'store-unavailable',
                  '스토어 연결을 사용할 수 없습니다.',
                  true,
                ),
              );
              return;
            }
            const products = await listTicketProducts();
            sendResult({ id: request.id, action: 'products', ok: true, products });
            return;
          }

          case 'purchase': {
            if (!iapReadyRef.current) {
              sendResult(
                errorResult(
                  request,
                  'store-unavailable',
                  '스토어 연결을 사용할 수 없습니다.',
                  true,
                ),
              );
              return;
            }
            if (pendingPurchaseRef.current) {
              sendResult(
                errorResult(
                  request,
                  'recovery-required',
                  '진행 중인 구매를 먼저 완료해 주세요.',
                  true,
                ),
              );
              return;
            }
            pendingPurchaseRef.current = request;
            try {
              await requestTicketPurchase(request);
            } catch {
              pendingPurchaseRef.current = undefined;
              sendResult(
                errorResult(request, 'native-error', '구매 화면을 열지 못했습니다.', true),
              );
            }
            return;
          }

          case 'restore-purchases': {
            if (!iapReadyRef.current) {
              sendResult(
                errorResult(
                  request,
                  'store-unavailable',
                  '스토어 연결을 사용할 수 없습니다.',
                  true,
                ),
              );
              return;
            }
            const purchases = await recoverTicketPurchases();
            const items: Extract<NativeResult, { action: 'restore-purchases'; ok: true }>['items'] =
              [];
            const partialItems: NonNullable<Extract<NativeResult, { ok: false }>['items']> = [];
            let hasFailure = false;
            let balance: number | undefined;
            for (const purchase of purchases) {
              if (
                !STORE_PRODUCT_IDS.includes(
                  purchase.productId as (typeof STORE_PRODUCT_IDS)[number],
                )
              ) {
                continue;
              }
              const productId = purchase.productId as (typeof STORE_PRODUCT_IDS)[number];
              if (purchase.purchaseState === 'pending') {
                items.push({ productId, state: 'pending' });
                partialItems.push({ productId, state: 'pending' });
                continue;
              }
              if (purchase.purchaseState !== 'purchased') continue;
              try {
                const result = await fulfillAndFinish(purchase, request.accessToken);
                balance = result.balance;
                const item = {
                  productId,
                  state: result.status,
                  tickets: result.tickets,
                } as const;
                items.push(item);
                partialItems.push(item);
              } catch (error) {
                hasFailure = true;
                partialItems.push({
                  productId,
                  state: 'failed',
                  errorCode: error instanceof PurchaseApiError ? error.code : 'native-error',
                });
              }
            }
            if (hasFailure) {
              sendResult(
                errorResult(
                  request,
                  'recovery-required',
                  '일부 구매를 복원하지 못했습니다. 다시 시도해 주세요.',
                  true,
                  { items: partialItems, balance },
                ),
              );
              return;
            }
            sendResult({
              id: request.id,
              action: 'restore-purchases',
              ok: true,
              state: 'restored',
              items,
              balance,
            });
            return;
          }
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '네이티브 작업 중 오류가 발생했습니다.';
        sendResult(errorResult(request, 'native-error', message));
      }
    },
    [callbackUrl, fulfillAndFinish, sendResult],
  );

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const request = parseNativeRequest(event.nativeEvent.data);
      if (request) void handleNativeRequest(request);
    },
    [handleNativeRequest],
  );

  const onShouldStartLoadWithRequest = useCallback<
    NonNullable<WebViewProps['onShouldStartLoadWithRequest']>
  >(
    (request) => {
      if (isAppOrigin(request.url)) return true;
      if (isOAuthCallback(request.url, callbackUrl)) {
        if (request.url.startsWith('jagalchi:')) void Linking.openURL(request.url);
        return false;
      }
      return false;
    },
    [callbackUrl],
  );

  const onNavigationStateChange = useCallback((navigation: WebViewNavigation) => {
    canGoBackRef.current = navigation.canGoBack;
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBackRef.current) return false;
      webViewRef.current?.goBack();
      return true;
    });
    return () => subscription.remove();
  }, []);

  const failConnection = useCallback((message: string) => {
    setLoading(false);
    setConnectionError(message);
  }, []);

  const onError = useCallback(
    (_event: WebViewErrorEvent) => failConnection('인터넷 연결을 확인하고 다시 시도해 주세요.'),
    [failConnection],
  );

  const onHttpError = useCallback(
    (event: WebViewHttpErrorEvent) => {
      if (event.nativeEvent.statusCode >= 500)
        failConnection('서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.');
    },
    [failConnection],
  );

  const onLoadEnd = useCallback(() => {
    setLoading(false);
  }, []);

  const retry = useCallback(() => {
    canGoBackRef.current = false;
    setConnectionError(null);
    setLoading(true);
    setReloadKey((key) => key + 1);
  }, []);

  return (
    <SafeAreaView
      style={[styles.safeArea, dark && styles.safeAreaDark]}
      edges={['top', 'right', 'bottom', 'left']}
    >
      <WebView
        key={reloadKey}
        ref={webViewRef}
        source={{ uri: WEB_URL }}
        style={styles.webView}
        originWhitelist={[`${WEB_ORIGIN}/*`]}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onNavigationStateChange={onNavigationStateChange}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={onLoadEnd}
        onError={onError}
        onHttpError={onHttpError}
      />

      {loading && !connectionError ? (
        <View
          style={[styles.overlay, dark && styles.overlayDark]}
          accessibilityLabel="페이지 불러오는 중"
        >
          <ActivityIndicator size="large" color="#3182F6" />
          <Text style={[styles.loadingText, dark && styles.textDark]}>자갈치 불러오는 중…</Text>
        </View>
      ) : null}

      {connectionError ? (
        <View style={[styles.overlay, dark && styles.overlayDark]} accessibilityRole="alert">
          <Text style={[styles.errorTitle, dark && styles.textDark]}>연결할 수 없어요</Text>
          <Text style={[styles.errorBody, dark && styles.mutedTextDark]}>{connectionError}</Text>
          <Pressable
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
            onPress={retry}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
          >
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <AppShell />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  safeAreaDark: { backgroundColor: '#101318' },
  webView: { flex: 1, backgroundColor: 'transparent' },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  overlayDark: { backgroundColor: '#101318' },
  loadingText: { marginTop: 14, color: '#4B5563', fontSize: 15, fontWeight: '600' },
  errorTitle: { color: '#111827', fontSize: 22, fontWeight: '700' },
  errorBody: { marginTop: 10, color: '#6B7280', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  textDark: { color: '#F9FAFB' },
  mutedTextDark: { color: '#D1D5DB' },
  retryButton: {
    marginTop: 24,
    borderRadius: 12,
    backgroundColor: '#3182F6',
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  retryButtonPressed: { opacity: 0.8 },
  retryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default App;

registerRootComponent(App);
