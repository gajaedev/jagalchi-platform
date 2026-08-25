'use client';

import { useAtomValue, useSetAtom } from 'jotai';

import type { JagalchiNodeData } from '@/types/roadmap.types';

import { selectedViewerNodeIdAtom, viewerNodesAtom } from '../../stores/viewer-atoms';

export function CardListMode() {
  const nodes = useAtomValue(viewerNodesAtom);
  const setSelectedNodeId = useSetAtom(selectedViewerNodeIdAtom);

  const nodeItems = nodes.filter((n) => n.type === 'jagalchi-node');

  if (nodeItems.length === 0) {
    return <div className="text-muted-foreground p-6 text-center text-sm">노드가 없습니다</div>;
  }

  return (
    <div className="grid gap-4 p-6">
      {nodeItems.map((node, index) => {
        const data = node.data as JagalchiNodeData;
        return (
          <article key={node.id} className="bg-card flex items-center gap-4 rounded-lg border p-4">
            <div className="bg-muted text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-md border text-sm font-bold">
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">{data.label}</h3>
              {data.description && (
                <p className="text-muted-foreground truncate text-xs">{data.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedNodeId(node.id)}
              className="bg-background hover:bg-muted inline-flex h-8 shrink-0 items-center rounded-md border px-3 text-xs"
            >
              보기
            </button>
          </article>
        );
      })}
    </div>
  );
}
