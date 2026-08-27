import { notFound } from 'next/navigation';

import { CareerReviewQueue } from '@/features/career/CareerReviewQueue';
import { isEnabled } from '@/lib/feature-flags';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '결과물 검증 대기열',
  description: '학습자가 제출한 결과물을 기준에 따라 검증합니다.',
};

export default function CareerReviewPage() {
  if (!isEnabled('EVIDENCE_EXECUTION_ENABLED')) notFound();

  return <CareerReviewQueue />;
}
