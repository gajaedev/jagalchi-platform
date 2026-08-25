import React from 'react';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider, useAtomValue, useSetAtom } from 'jotai';

import type { RoadmapNode } from '../types/editor.types';
import type { Edge } from '@xyflow/react';

// Mock createId to return predictable IDs
let idCounter = 0;
vi.mock('../utils/node-factory', () => ({
  createId: () => `mock-id-${++idCounter}`,
}));

import {
  nodesAtom,
  edgesAtom,
  selectedNodeIdsAtom,
  selectedEdgeIdsAtom,
} from '../stores/editor-atoms';
import { useKeyboardShortcuts } from './use-keyboard-shortcuts';

// --- Test helpers ---

/**
 * Wrapper that initializes atoms imperatively via setters.
 * nodesAtom/edgesAtom are derived from editorStateHistoryAtom (withHistory),
 * so useHydrateAtoms doesn't work — we must use their write functions.
 */
function InitAtoms({
  nodes,
  edges,
  selectedNodeIds,
  selectedEdgeIds,
  children,
}: {
  nodes: RoadmapNode[];
  edges: Edge[];
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  children?: React.ReactNode;
}) {
  const setNodes = useSetAtom(nodesAtom);
  const setEdges = useSetAtom(edgesAtom);
  const setSelectedNodeIds = useSetAtom(selectedNodeIdsAtom);
  const setSelectedEdgeIds = useSetAtom(selectedEdgeIdsAtom);

  // Initialize on first render only
  const initialized = React.useRef<boolean>(null);
  if (initialized.current == null) {
    initialized.current = true;
    setNodes(nodes);
    setEdges(edges);
    setSelectedNodeIds(selectedNodeIds);
    setSelectedEdgeIds(selectedEdgeIds);
  }

  return React.createElement(React.Fragment, null, children);
}

function createWrapper(opts: {
  nodes?: RoadmapNode[];
  edges?: Edge[];
  selectedNodeIds?: string[];
  selectedEdgeIds?: string[];
}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      Provider,
      null,
      React.createElement(
        InitAtoms,
        {
          nodes: opts.nodes ?? [],
          edges: opts.edges ?? [],
          selectedNodeIds: opts.selectedNodeIds ?? [],
          selectedEdgeIds: opts.selectedEdgeIds ?? [],
        },
        children,
      ),
    );
  };
}

const makeNode = (id: string, label: string): RoadmapNode =>
  ({
    id,
    type: 'jagalchi-node',
    position: { x: 100, y: 200 },
    data: { label, description: '', resources: [], variant: 'white', isLocked: false },
  }) as RoadmapNode;

const makeEdge = (id: string, source: string, target: string): Edge =>
  ({
    id,
    source,
    target,
  }) as Edge;

function dispatchKeydown(options: globalThis.KeyboardEventInit) {
  const event = new KeyboardEvent('keydown', { bubbles: true, ...options });
  window.dispatchEvent(event);
}

// --- Tests ---

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    idCounter = 0;
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Delete key removes selected nodes and connected edges', () => {
    const nodes = [makeNode('n1', 'Node 1'), makeNode('n2', 'Node 2')];
    const edges = [makeEdge('e1', 'n1', 'n2')];

    const wrapper = createWrapper({
      nodes,
      edges,
      selectedNodeIds: ['n1'],
      selectedEdgeIds: [],
    });

    const { result } = renderHook(
      () => {
        useKeyboardShortcuts();
        return {
          nodes: useAtomValue(nodesAtom),
          edges: useAtomValue(edgesAtom),
          selectedNodeIds: useAtomValue(selectedNodeIdsAtom),
        };
      },
      { wrapper },
    );

    act(() => {
      dispatchKeydown({ key: 'Delete' });
    });

    expect(result.current.nodes).toHaveLength(1);
    expect(result.current.nodes[0].id).toBe('n2');
    // Edge connected to deleted node should also be removed
    expect(result.current.edges).toHaveLength(0);
    expect(result.current.selectedNodeIds).toHaveLength(0);
  });

  it('Escape key clears selection', () => {
    const nodes = [makeNode('n1', 'Node 1')];

    const wrapper = createWrapper({
      nodes,
      edges: [],
      selectedNodeIds: ['n1'],
      selectedEdgeIds: ['e1'],
    });

    const { result } = renderHook(
      () => {
        useKeyboardShortcuts();
        return {
          selectedNodeIds: useAtomValue(selectedNodeIdsAtom),
          selectedEdgeIds: useAtomValue(selectedEdgeIdsAtom),
        };
      },
      { wrapper },
    );

    act(() => {
      dispatchKeydown({ key: 'Escape' });
    });

    expect(result.current.selectedNodeIds).toHaveLength(0);
    expect(result.current.selectedEdgeIds).toHaveLength(0);
  });

  it('Ctrl+Z undoes the last action (duplicate → undo)', () => {
    const nodes = [makeNode('n1', 'Node 1')];

    const wrapper = createWrapper({
      nodes,
      edges: [],
      selectedNodeIds: ['n1'],
      selectedEdgeIds: [],
    });

    const { result } = renderHook(
      () => {
        useKeyboardShortcuts();
        return {
          nodes: useAtomValue(nodesAtom),
        };
      },
      { wrapper },
    );

    // Ctrl+D to duplicate — creates a history entry
    act(() => {
      dispatchKeydown({ key: 'd', ctrlKey: true });
    });
    expect(result.current.nodes).toHaveLength(2);

    // Ctrl+Z to undo — should revert the duplicate
    act(() => {
      dispatchKeydown({ key: 'z', ctrlKey: true });
    });
    expect(result.current.nodes).toHaveLength(1);
  });

  it('Ctrl+Shift+Z redoes the undone action', () => {
    const nodes = [makeNode('n1', 'Node 1')];

    const wrapper = createWrapper({
      nodes,
      edges: [],
      selectedNodeIds: ['n1'],
      selectedEdgeIds: [],
    });

    const { result } = renderHook(
      () => {
        useKeyboardShortcuts();
        return {
          nodes: useAtomValue(nodesAtom),
        };
      },
      { wrapper },
    );

    // Duplicate → Undo → Redo
    act(() => {
      dispatchKeydown({ key: 'd', ctrlKey: true });
    });
    expect(result.current.nodes).toHaveLength(2);

    act(() => {
      dispatchKeydown({ key: 'z', ctrlKey: true });
    });
    expect(result.current.nodes).toHaveLength(1);

    act(() => {
      dispatchKeydown({ key: 'z', ctrlKey: true, shiftKey: true });
    });
    expect(result.current.nodes).toHaveLength(2);
  });

  it('Ctrl+A selects all nodes and edges', () => {
    const nodes = [makeNode('n1', 'Node 1'), makeNode('n2', 'Node 2')];
    const edges = [makeEdge('e1', 'n1', 'n2')];

    const wrapper = createWrapper({
      nodes,
      edges,
      selectedNodeIds: [],
      selectedEdgeIds: [],
    });

    const { result } = renderHook(
      () => {
        useKeyboardShortcuts();
        return {
          selectedNodeIds: useAtomValue(selectedNodeIdsAtom),
          selectedEdgeIds: useAtomValue(selectedEdgeIdsAtom),
        };
      },
      { wrapper },
    );

    act(() => {
      dispatchKeydown({ key: 'a', ctrlKey: true });
    });

    expect(result.current.selectedNodeIds).toEqual(['n1', 'n2']);
    expect(result.current.selectedEdgeIds).toEqual(['e1']);
  });

  it('Ctrl+C and Ctrl+V copies and pastes selected nodes', () => {
    const nodes = [makeNode('n1', 'Node 1'), makeNode('n2', 'Node 2')];
    const edges = [makeEdge('e1', 'n1', 'n2')];

    const wrapper = createWrapper({
      nodes,
      edges,
      selectedNodeIds: ['n1', 'n2'],
      selectedEdgeIds: [],
    });

    const { result } = renderHook(
      () => {
        useKeyboardShortcuts();
        return {
          nodes: useAtomValue(nodesAtom),
          edges: useAtomValue(edgesAtom),
          selectedNodeIds: useAtomValue(selectedNodeIdsAtom),
        };
      },
      { wrapper },
    );

    // Copy
    act(() => {
      dispatchKeydown({ key: 'c', ctrlKey: true });
    });

    // Verify clipboard was set
    const clipboard = localStorage.getItem('jagalchi-clipboard');
    expect(clipboard).toBeTruthy();

    const clipboardData = JSON.parse(clipboard!) as { nodes: RoadmapNode[]; edges: Edge[] };
    expect(clipboardData.nodes).toHaveLength(2);
    expect(clipboardData.edges).toHaveLength(1);

    // Paste
    act(() => {
      dispatchKeydown({ key: 'v', ctrlKey: true });
    });

    // Should have original 2 + pasted 2 nodes
    expect(result.current.nodes).toHaveLength(4);
    // Pasted nodes should have new IDs
    const pastedNodes = result.current.nodes.slice(2);
    expect(pastedNodes[0].id).toBe('mock-id-1');
    expect(pastedNodes[1].id).toBe('mock-id-2');
    // Pasted nodes should be offset by 50px
    expect(pastedNodes[0].position.x).toBe(150);
    expect(pastedNodes[0].position.y).toBe(250);
    // Selection should update to pasted nodes
    expect(result.current.selectedNodeIds).toEqual(['mock-id-1', 'mock-id-2']);
  });

  it('Ctrl+D duplicates selected nodes', () => {
    const nodes = [makeNode('n1', 'Node 1')];

    const wrapper = createWrapper({
      nodes,
      edges: [],
      selectedNodeIds: ['n1'],
      selectedEdgeIds: [],
    });

    const { result } = renderHook(
      () => {
        useKeyboardShortcuts();
        return {
          nodes: useAtomValue(nodesAtom),
          selectedNodeIds: useAtomValue(selectedNodeIdsAtom),
        };
      },
      { wrapper },
    );

    act(() => {
      dispatchKeydown({ key: 'd', ctrlKey: true });
    });

    expect(result.current.nodes).toHaveLength(2);
    const duplicated = result.current.nodes[1];
    expect(duplicated.id).toBe('mock-id-1');
    expect(duplicated.position.x).toBe(150);
    expect(duplicated.position.y).toBe(250);
    // Selection should be the duplicated node
    expect(result.current.selectedNodeIds).toEqual(['mock-id-1']);
  });

  it.each(['input', 'textarea'] as const)(
    'ignores shortcuts when target is a %s element',
    (tagName) => {
      const nodes = [makeNode('n1', 'Node 1')];

      const wrapper = createWrapper({
        nodes,
        edges: [],
        selectedNodeIds: ['n1'],
        selectedEdgeIds: [],
      });

      const { result } = renderHook(
        () => {
          useKeyboardShortcuts();
          return {
            nodes: useAtomValue(nodesAtom),
            selectedNodeIds: useAtomValue(selectedNodeIdsAtom),
          };
        },
        { wrapper },
      );

      const element = document.createElement(tagName);
      document.body.appendChild(element);
      element.focus();

      act(() => {
        // Dispatch from the focused element — bubbles to window with element as target
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
      });

      // Node should NOT be deleted since event came from an editable element
      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.selectedNodeIds).toEqual(['n1']);

      document.body.removeChild(element);
    },
  );
});
