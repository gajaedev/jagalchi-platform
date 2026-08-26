'use client';

import { useAtomValue, useSetAtom } from 'jotai';

import type { JagalchiNodeData } from '@/types/roadmap.types';

import { selectedViewerNodeIdAtom, viewerNodesAtom } from '../../stores/viewer-atoms';

export function CardListMode() {
  const nodes = useAtomValue(viewerNodesAtom);
  const setSelectedNodeId = useSetAtom(selectedViewerNodeIdAtom);

  const nodeItems = nodes.filter((n) => n.type === 'jagalchi-node');

  if (nodeItems.length === 0) {
    return (
      <div className="text-muted-foreground p-6 text-center text-sm">실행 단계가 없습니다</div>
    );
  }

  return (
    <div className="grid w-full min-w-0 gap-3 overflow-hidden p-3 sm:gap-4 sm:p-6">
      {nodeItems.map((node, index) => {
        const data = node.data as JagalchiNodeData;
        return (
          <article
            key={node.id}
            className="bg-card flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-lg border p-3 sm:gap-4 sm:p-4"
          >
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
              className="bg-background hover:bg-muted inline-flex h-8 shrink-0 items-center rounded-md border px-2 text-xs sm:px-3"
            >
              보기
            </button>
          </article>
        );
      })}
    </div>
  );
}
