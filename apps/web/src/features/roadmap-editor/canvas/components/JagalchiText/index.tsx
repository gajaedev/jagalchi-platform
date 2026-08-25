'use client';

import { memo } from 'react';

import { JagalchiTextBase } from '@/components/roadmap/nodes/JagalchiTextBase';
import type { JagalchiTextData } from '@/types/roadmap.types';

interface JagalchiTextProps {
  data: JagalchiTextData;
}

export const JagalchiText = memo(function JagalchiText({ data }: JagalchiTextProps) {
  return <JagalchiTextBase data={data} />;
});
