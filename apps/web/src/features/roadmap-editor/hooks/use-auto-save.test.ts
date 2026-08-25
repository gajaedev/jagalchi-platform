import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  updateEditableRoadmap: vi.fn(async () => ({ id: 'roadmap-1' })),
}));

vi.mock('@/api/roadmap-domain', () => api);
vi.mock('@/hooks/use-debounce', () => ({
  useDebounce: <T>(value: T): T => value,
}));

import { useAutoSave } from './use-auto-save';

import type { RoadmapNode } from '../types/editor.types';
import type { Edge } from '@xyflow/react';

const makeNode = (id: string, label: string): RoadmapNode =>
  ({
    id,
    type: 'jagalchi-node',
    position: { x: 0, y: 0 },
    data: { label, description: '', resources: [], variant: 'white', isLocked: false },
  }) as RoadmapNode;

const makeEdge = (id: string, source: string, target: string): Edge => ({
  id,
  source,
  target,
});

const roadmapId = '11111111-1111-4111-8111-111111111111';

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.updateEditableRoadmap.mockResolvedValue({ id: roadmapId });
  });

  it('persists the UUID roadmap graph through the Nest API', async () => {
    const nodes = [makeNode('n1', 'Node 1')];
    const edges = [makeEdge('e1', 'n1', 'n2')];

    renderHook(() => useAutoSave({ roadmapId, nodes, edges, title: 'Test', isEnabled: true }));

    await waitFor(() =>
      expect(api.updateEditableRoadmap).toHaveBeenCalledWith(roadmapId, {
        title: 'Test',
        graph: { schemaVersion: 1, nodes, edges },
      }),
    );
    expect(localStorage.length).toBe(0);
  });

  it('does not save when disabled', () => {
    renderHook(() =>
      useAutoSave({
        roadmapId,
        nodes: [makeNode('n1', 'Node 1')],
        edges: [],
        title: 'Test',
        isEnabled: false,
      }),
    );
    expect(api.updateEditableRoadmap).not.toHaveBeenCalled();
  });

  it('skips an identical rerender after the prior save commits', async () => {
    const nodes = [makeNode('n1', 'Node 1')];
    const edges = [makeEdge('e1', 'n1', 'n2')];
    const { rerender } = renderHook(
      ({ title }) => useAutoSave({ roadmapId, nodes, edges, title, isEnabled: true }),
      { initialProps: { title: 'Test' } },
    );

    await waitFor(() => expect(api.updateEditableRoadmap).toHaveBeenCalledTimes(1));
    await act(async () => rerender({ title: 'Test' }));
    expect(api.updateEditableRoadmap).toHaveBeenCalledTimes(1);
  });

  it('surfaces API failures without marking the state as saved', async () => {
    const error = new Error('save failed');
    api.updateEditableRoadmap.mockRejectedValue(error);
    const listener = vi.fn();
    window.addEventListener('jagalchi:autosave-error', listener);

    renderHook(() =>
      useAutoSave({
        roadmapId,
        nodes: [makeNode('n1', 'Node 1')],
        edges: [],
        title: 'Test',
      }),
    );

    await waitFor(() => expect(listener).toHaveBeenCalled());
    const event = listener.mock.calls[0]?.[0] as CustomEvent;
    expect(event.detail).toBe(error);
    window.removeEventListener('jagalchi:autosave-error', listener);
  });
});
