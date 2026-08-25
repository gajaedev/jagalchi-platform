'use client';

import { memo } from 'react';

import { NodeResizer } from '@xyflow/react';
import { useSetAtom } from 'jotai';

import { JagalchiSectionBase } from '@/components/roadmap/nodes/JagalchiSectionBase';
import { nodesAtom } from '@/features/roadmap-editor/stores/editor-atoms';
import type { JagalchiSectionData, JagalchiSectionType } from '@/types/roadmap.types';

interface JagalchiSectionProps {
  id: string;
  data: JagalchiSectionData;
  selected?: boolean;
}

export const JagalchiSection = memo(function JagalchiSection({
  id,
  data,
  selected,
}: JagalchiSectionProps) {
  const setNodes = useSetAtom(nodesAtom);

  const handleResize = (_event: unknown, params: { width: number; height: number }) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === id
          ? ({
              ...n,
              style: {
                ...n.style,
                width: params.width,
                height: params.height,
              },
            } as JagalchiSectionType)
          : n,
      ),
    );
  };

  return (
    <JagalchiSectionBase data={data} selected={selected}>
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={200}
        onResizeEnd={handleResize}
        handleClassName="h-3! w-3! rounded-none! border-2! border-blue-600! bg-background!"
      />
    </JagalchiSectionBase>
  );
});
