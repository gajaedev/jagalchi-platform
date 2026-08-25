import withBundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';

import type { NextConfig } from 'next';

const API_ORIGIN = process.env.API_ORIGIN ?? 'https://api.jagalchi.dev';
const CDN_ORIGIN = 'https://cdn.jagalchi.dev';

function getOrigin(value: string | undefined): string | undefined {
  if (!value || value.startsWith('/')) return undefined;

  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function toWebSocketOrigin(origin: string): string {
  return origin.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
}

const PUBLIC_API_ORIGIN = getOrigin(process.env.NEXT_PUBLIC_API_URL);
const PUBLIC_WS_HTTP_ORIGIN = getOrigin(process.env.NEXT_PUBLIC_WS_URL) ?? API_ORIGIN;
const PUBLIC_WS_TRANSPORT_ORIGIN = toWebSocketOrigin(PUBLIC_WS_HTTP_ORIGIN);
const CONNECT_ORIGINS = Array.from(
  new Set(
    ['self', API_ORIGIN, PUBLIC_API_ORIGIN, PUBLIC_WS_HTTP_ORIGIN, PUBLIC_WS_TRANSPORT_ORIGIN]
      .filter((origin): origin is string => Boolean(origin))
      .map((origin) => (origin === 'self' ? "'self'" : origin)),
  ),
).join(' ');

const cspHeader = [
  `default-src 'self'`,
  // Scripts: self + Next.js inline scripts (unsafe-inline은 nonce 도입 전 임시 허용)
  `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
  // Styles: self + inline (Tailwind CSS-in-JS, shadcn 인라인)
  `style-src 'self' 'unsafe-inline'`,
  // Images: self + CDN + OAuth 아바타 출처
  `img-src 'self' data: blob: ${CDN_ORIGIN} https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://*.r2.dev https://*.s3.amazonaws.com`,
  // Fonts: self (Next.js google fonts 로컬 다운로드)
  `font-src 'self'`,
  // API 요청 + WebSocket
  `connect-src ${CONNECT_ORIGINS}`,
  // Frames: same-origin only (X-Frame-Options SAMEORIGIN과 일치)
  `frame-src 'self'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  // 위반 리포트 — 운영 중 CSP 위반 수집 (Sentry 연동 후 report-uri 교체 가능)
  process.env.NODE_ENV === 'production' ? `upgrade-insecure-requests` : undefined,
]
  .filter((directive): directive is string => Boolean(directive))
  .join('; ')
  .trim();

const nextConfig: NextConfig = {
  reactCompiler: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'cdn.jagalchi.dev' },
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: '*.s3.amazonaws.com' },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const hasSentryDsn = Boolean(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN);

export default hasSentryDsn
  ? withSentryConfig(bundleAnalyzer(nextConfig), {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: true,
      widenClientFileUpload: true,
      sourcemaps: { disable: false, deleteSourcemapsAfterUpload: true },
      disableLogger: true,
      automaticVercelMonitors: false,
    })
  : bundleAnalyzer(nextConfig);
