'use client';

import { memo, useCallback } from 'react';

import { useReactFlow } from '@xyflow/react';
import { useSetAtom } from 'jotai';

import { JagalchiNodeBase } from '@/components/roadmap/nodes/JagalchiNodeBase';
import { nodesAtom } from '@/features/roadmap-editor/stores/editor-atoms';
import { createJagalchiNode } from '@/features/roadmap-editor/utils/node-factory';
import type { JagalchiNodeData } from '@/types/roadmap.types';

import { PlusButtonHandle } from '../PlusButtonHandle';

interface JagalchiNodeProps {
  data: JagalchiNodeData;
  selected?: boolean;
  id: string;
}

const POSITION_OFFSET = 100;

export const JagalchiNode = memo(function JagalchiNode({ data, selected, id }: JagalchiNodeProps) {
  const setNodes = useSetAtom(nodesAtom);
  const { getNode } = useReactFlow();

  const handleCreateNode = useCallback(
    (position: 'top' | 'right' | 'bottom' | 'left') => {
      const currentNode = getNode(id);
      if (!currentNode) return;

      const offsets = {
        top: { x: 0, y: -POSITION_OFFSET },
        right: { x: POSITION_OFFSET, y: 0 },
        bottom: { x: 0, y: POSITION_OFFSET },
        left: { x: -POSITION_OFFSET, y: 0 },
      };

      const offset = offsets[position];
      const newNode = createJagalchiNode({
        position: {
          x: currentNode.position.x + offset.x,
          y: currentNode.position.y + offset.y,
        },
        variant: data.variant,
      });

      setNodes((prevNodes) => [...prevNodes, newNode]);
    },
    [id, data.variant, getNode, setNodes],
  );

  return (
    <JagalchiNodeBase data={data} selected={selected}>
      {selected && (
        <>
          <PlusButtonHandle position="top" onCreateNode={handleCreateNode} />
          <PlusButtonHandle position="right" onCreateNode={handleCreateNode} />
          <PlusButtonHandle position="bottom" onCreateNode={handleCreateNode} />
          <PlusButtonHandle position="left" onCreateNode={handleCreateNode} />
        </>
      )}
    </JagalchiNodeBase>
  );
});
