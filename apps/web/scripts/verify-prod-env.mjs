#!/usr/bin/env node
/**
 * 프로덕션 배포 전 환경변수 안전성 검증.
 * Vercel/Netlify 프로덕션 빌드 파이프라인에서 호출하여 실수로 mocking 이 켜지지 않도록 막는다.
 */
const isProductionCheck =
  process.argv.includes('--production') || process.env.VERCEL_ENV === 'production';

if (!isProductionCheck) {
  console.log('[verify-prod-env] skipped outside production deployment');
  process.exit(0);
}

const errors = [];

if (process.env.NEXT_PUBLIC_API_MOCKING === 'true') {
  errors.push(
    'NEXT_PUBLIC_API_MOCKING must not be "true" in production — MSW should never intercept real users.',
  );
}

if (!process.env.NEXT_PUBLIC_API_URL) {
  errors.push('NEXT_PUBLIC_API_URL is required in production.');
}

const apiOrigin = process.env.API_ORIGIN;
if (!apiOrigin) {
  errors.push('API_ORIGIN is required in production.');
} else {
  try {
    const parsedApiOrigin = new URL(apiOrigin);
    if (parsedApiOrigin.protocol !== 'https:') {
      errors.push('API_ORIGIN must use HTTPS in production.');
    }
    if (
      parsedApiOrigin.pathname !== '/' ||
      parsedApiOrigin.search ||
      parsedApiOrigin.hash
    ) {
      errors.push('API_ORIGIN must not include a pathname, query string, or hash.');
    }
  } catch {
    errors.push('API_ORIGIN must be a valid absolute URL.');
  }
}

if (errors.length > 0) {
  console.error('[verify-prod-env] production env checks failed:');
  for (const err of errors) {
    console.error(` - ${err}`);
  }
  process.exit(1);
}

console.log('[verify-prod-env] OK');
