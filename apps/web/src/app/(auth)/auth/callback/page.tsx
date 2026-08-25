import { OAuthCallback } from '@/features/auth/components/organisms/OAuthCallback';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인 완료',
  robots: { index: false, follow: false },
};

export default async function OAuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  const rawCode = (await searchParams).code;
  const code = Array.isArray(rawCode) ? rawCode[0] : rawCode;
  return <OAuthCallback code={code ?? null} />;
}
