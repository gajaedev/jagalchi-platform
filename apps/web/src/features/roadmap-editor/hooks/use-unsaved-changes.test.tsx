import { act, renderHook } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  updateEditableRoadmap: vi.fn(async () => ({ id: 'roadmap-1' })),
  push: vi.fn(),
}));

vi.mock('@/api/roadmap-domain', () => ({
  updateEditableRoadmap: mocks.updateEditableRoadmap,
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));

import { edgesAtom, nodesAtom, roadmapTitleAtom } from '../stores/editor-atoms';
import { useUnsavedChanges } from './use-unsaved-changes';

const roadmapId = '11111111-1111-4111-8111-111111111111';

function createWrapper() {
  const store = createStore();
  store.set(nodesAtom, []);
  store.set(edgesAtom, []);
  store.set(roadmapTitleAtom, 'UUID 로드맵');
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe('useUnsavedChanges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateEditableRoadmap.mockResolvedValue({ id: roadmapId });
  });

  it('manually saves through the authoritative UUID endpoint', async () => {
    const { result } = renderHook(
      () =>
        useUnsavedChanges({
          roadmapId,
          initialNodes: 'initial-nodes',
          initialEdges: 'initial-edges',
          initialTitle: '이전 제목',
          isLoading: false,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => expect(await result.current.handleSave()).toBe(true));
    expect(mocks.updateEditableRoadmap).toHaveBeenCalledWith(roadmapId, {
      title: 'UUID 로드맵',
      graph: { schemaVersion: 1, nodes: [], edges: [] },
    });
  });

  it('exits only after the server save succeeds', async () => {
    const { result } = renderHook(
      () =>
        useUnsavedChanges({
          roadmapId,
          initialNodes: 'initial-nodes',
          initialEdges: 'initial-edges',
          initialTitle: '이전 제목',
          isLoading: false,
        }),
      { wrapper: createWrapper() },
    );

    await act(async () => result.current.handleSaveAndExit());
    expect(mocks.push).toHaveBeenCalledWith('/myroadmap');

    mocks.push.mockClear();
    mocks.updateEditableRoadmap.mockRejectedValue(new Error('failed'));
    await act(async () => result.current.handleSaveAndExit());
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
