'use client';

import { memo } from 'react';

import { Handle, Position } from '@xyflow/react';

import { getNodeColors } from '@/components/roadmap/constants/node-colors';
import { cn } from '@/lib/utils';
import type { JagalchiNodeData } from '@/types/roadmap.types';

interface JagalchiNodeBaseProps {
  data: JagalchiNodeData;
  selected?: boolean;
  children?: React.ReactNode;
}

export const JagalchiNodeBase = memo(function JagalchiNodeBase({
  data,
  selected,
  children,
}: JagalchiNodeBaseProps) {
  const state = selected ? 'focus' : 'default';
  const colors = getNodeColors(data.variant, state);

  return (
    <div
      className={cn(
        'relative flex h-12 min-w-[200px] items-center justify-center rounded-lg border-2 px-5 py-2.5 transition-colors',
        colors.bg,
        colors.border,
        colors.text,
      )}
    >
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className={cn('!border-background !h-1.5 !w-1.5 !rounded-[4px] !border-2', colors.handle)}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={cn('!border-background !h-1.5 !w-1.5 !rounded-[4px] !border-2', colors.handle)}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className={cn('!border-background !h-1.5 !w-1.5 !rounded-[4px] !border-2', colors.handle)}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={cn('!border-background !h-1.5 !w-1.5 !rounded-[4px] !border-2', colors.handle)}
      />

      <span className="truncate text-base font-medium">{data.label}</span>

      {children}
    </div>
  );
});
