'use client';

import { useCallback, useMemo } from 'react';

import {
  Background,
  ConnectionMode,
  ReactFlow,
  useOnViewportChange,
  type NodeTypes,
  type OnSelectionChangeFunc,
  type Viewport,
} from '@xyflow/react';
import { useAtomValue, useSetAtom } from 'jotai';

import { JagalchiNodeBase } from '@/components/roadmap/nodes/JagalchiNodeBase';
import { JagalchiSectionBase } from '@/components/roadmap/nodes/JagalchiSectionBase';
import { JagalchiTextBase } from '@/components/roadmap/nodes/JagalchiTextBase';

import {
  selectedViewerNodeIdAtom,
  viewerEdgesAtom,
  viewerNodesAtom,
  viewerZoomLevelAtom,
} from '../../stores/viewer-atoms';

import '@xyflow/react/dist/style.css';

const nodeTypes: NodeTypes = {
  'jagalchi-node': JagalchiNodeBase,
  'jagalchi-section': JagalchiSectionBase,
  'jagalchi-text': JagalchiTextBase,
};

const defaultEdgeOptions = {
  type: 'smoothstep',
};

export function ViewerCanvas() {
  const nodes = useAtomValue(viewerNodesAtom);
  const edges = useAtomValue(viewerEdgesAtom);
  const setSelectedNodeId = useSetAtom(selectedViewerNodeIdAtom);
  const setZoomLevel = useSetAtom(viewerZoomLevelAtom);

  const handleSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes: selectedNodes }) => {
      if (selectedNodes.length === 1) {
        setSelectedNodeId(selectedNodes[0].id);
      } else {
        setSelectedNodeId(null);
      }
    },
    [setSelectedNodeId],
  );

  const handleViewportChange = useCallback(
    (viewport: Viewport) => {
      setZoomLevel(viewport.zoom);
    },
    [setZoomLevel],
  );

  useOnViewportChange({
    onEnd: handleViewportChange,
  });

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  return (
    <div className="border-border bg-surface-raised h-[700px] w-full rounded-xl border shadow-sm">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        nodesDraggable={false}
        nodesConnectable={false}
        connectionMode={ConnectionMode.Loose}
        elementsSelectable={true}
        onSelectionChange={handleSelectionChange}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        proOptions={proOptions}
      >
        <Background gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}
