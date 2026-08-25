'use client';

import { memo } from 'react';

import { getTextColor } from '@/components/roadmap/constants/node-colors';
import { EDITOR_MESSAGES } from '@/constants/messages';
import { cn } from '@/lib/utils';
import type { JagalchiTextData } from '@/types/roadmap.types';

interface JagalchiTextBaseProps {
  data: JagalchiTextData;
}

export const JagalchiTextBase = memo(function JagalchiTextBase({ data }: JagalchiTextBaseProps) {
  const textColor = getTextColor(data.variant);
  const displayContent = data.content ?? EDITOR_MESSAGES.FLOW_TEXT_DEFAULT_CONTENT;

  return (
    <div
      className={cn('min-w-[80px] px-1 transition-colors', textColor)}
      style={{
        fontSize: `${data.fontSize}px`,
        fontWeight: data.fontWeight === 'bold' ? 600 : 400,
      }}
    >
      {displayContent}
    </div>
  );
});
