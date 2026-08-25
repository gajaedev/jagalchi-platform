import { atom } from 'jotai';

import type { Roadmap, RoadmapNode } from '@/types/roadmap.types';

import type { Edge } from '@xyflow/react';

export const viewerRoadmapAtom = atom<Roadmap | null>(null);

export const viewerNodesAtom = atom<RoadmapNode[]>((get) => {
  const roadmap = get(viewerRoadmapAtom);
  return roadmap?.nodes ?? [];
});

export const viewerEdgesAtom = atom<Edge[]>((get) => {
  const roadmap = get(viewerRoadmapAtom);
  return roadmap?.edges ?? [];
});

export const selectedViewerNodeIdAtom = atom<string | null>(null);

export const selectedViewerNodeAtom = atom<RoadmapNode | null>((get) => {
  const nodes = get(viewerNodesAtom);
  const selectedId = get(selectedViewerNodeIdAtom);
  if (!selectedId) return null;
  return nodes.find((node) => node.id === selectedId) ?? null;
});

export const viewerZoomLevelAtom = atom<number>(1);

export const viewerLayoutAtom = atom<'page' | 'cards'>('page');

export const viewerLoadingAtom = atom<boolean>(true);

export const viewerErrorAtom = atom<string | null>(null);

export const viewerSidebarOpenAtom = atom<boolean>(true);
