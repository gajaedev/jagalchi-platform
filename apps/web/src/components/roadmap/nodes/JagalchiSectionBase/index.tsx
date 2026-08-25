'use client';

import { memo } from 'react';

import { getNodeColors } from '@/components/roadmap/constants/node-colors';
import { EDITOR_MESSAGES } from '@/constants/messages';
import { cn } from '@/lib/utils';
import type { JagalchiSectionData } from '@/types/roadmap.types';

interface JagalchiSectionBaseProps {
  data: JagalchiSectionData;
  selected?: boolean;
  children?: React.ReactNode;
}

export const JagalchiSectionBase = memo(function JagalchiSectionBase({
  data,
  selected,
  children,
}: JagalchiSectionBaseProps) {
  const state = selected ? 'focus' : 'default';
  const colors = getNodeColors(data.variant, state);
  const displayTitle = data.title || EDITOR_MESSAGES.FLOW_SECTION_DEFAULT_TITLE;

  return (
    <div className="flex h-full w-full flex-col items-start gap-1">
      {children}

      <div
        className={cn(
          'flex items-center justify-center rounded px-2 py-1 text-sm font-medium',
          colors.badge,
        )}
      >
        {displayTitle}
      </div>

      <div
        className={cn(
          'bg-background w-full flex-1 rounded-lg border-2 transition-colors',
          colors.sectionBorder,
        )}
      />
    </div>
  );
});
