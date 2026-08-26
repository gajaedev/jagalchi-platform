import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '실행 과제',
};

export default function MyRoadmapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
