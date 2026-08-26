import { Inter, JetBrains_Mono } from 'next/font/google';

import { MSWProvider } from '@/components/MswProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { WebVitals } from '@/components/WebVitals';
import { AuthProvider } from '@/features/auth';

import type { Metadata } from 'next';

import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: '자갈치 — 증거로 준비하는 개발자 커리어',
    template: '%s | 자갈치',
  },
  description:
    '목표 직무의 요구 역량과 GitHub·배포·기술 문서를 연결해 부족한 커리어 증거를 확인하고 검증합니다.',
  icons: {
    icon: '/jagalchi.svg',
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: '자갈치 — 증거로 준비하는 개발자 커리어',
    description: '채용공고의 요구 역량과 실제 결과물 사이의 차이를 확인하고 검증합니다.',
    siteName: '자갈치',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '자갈치 — 증거로 준비하는 개발자 커리어',
    description: '채용공고의 요구 역량과 실제 결과물 사이의 차이를 확인하고 검증합니다.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <ThemeProvider>
          <MSWProvider>
            <QueryProvider>
              <AuthProvider>{children}</AuthProvider>
            </QueryProvider>
          </MSWProvider>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
        <WebVitals />
      </body>
    </html>
  );
}
