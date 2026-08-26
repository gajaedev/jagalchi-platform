import { CareerWorkspace } from '@/features/career/CareerWorkspace';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Career Diff',
  description: '목표 직무의 요구 역량과 검증된 결과물 사이의 차이를 확인하세요.',
};

export default function CareerPage() {
  return <CareerWorkspace />;
}
