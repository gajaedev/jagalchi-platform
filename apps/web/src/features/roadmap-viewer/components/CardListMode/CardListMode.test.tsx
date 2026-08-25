import React from 'react';

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Provider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

vi.mock('@xyflow/react', () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReactFlow: () => ({ fitView: vi.fn(), zoomIn: vi.fn(), zoomOut: vi.fn(), getZoom: () => 1 }),
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  ReactFlow: () => <div data-testid="react-flow" />,
  Background: () => null,
  Controls: () => null,
  MiniMap: () => null,
}));

import type { RoadmapNode } from '@/types/roadmap.types';
import { viewerRoadmapAtom } from '../../stores/viewer-atoms';
import { CardListMode } from './index';

function HydrateAtoms({
  initialValues,
  children,
}: {
  initialValues: any;
  children: React.ReactNode;
}) {
  useHydrateAtoms(initialValues);
  return <>{children}</>;
}

function TestWrapper({
  initialValues = [],
  children,
}: {
  initialValues?: any;
  children: React.ReactNode;
}) {
  return (
    <Provider>
      <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
    </Provider>
  );
}

const makeNode = (id: string, label: string, description = ''): RoadmapNode =>
  ({
    id,
    type: 'jagalchi-node',
    position: { x: 0, y: 0 },
    data: { label, description, resources: [], variant: 'white', isLocked: false },
  }) as RoadmapNode;

const mockRoadmap = {
  id: 'r1',
  title: 'Test Roadmap',
  nodes: [makeNode('n1', 'First Node', 'desc one'), makeNode('n2', 'Second Node')],
  edges: [],
  isPublic: true,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('CardListMode', () => {
  it('shows empty state when there are no nodes', () => {
    const emptyRoadmap = { ...mockRoadmap, nodes: [] };
    render(
      <TestWrapper initialValues={[[viewerRoadmapAtom, emptyRoadmap]]}>
        <CardListMode />
      </TestWrapper>,
    );
    expect(screen.getByText('노드가 없습니다')).toBeTruthy();
  });

  it('renders a card for each jagalchi-node', () => {
    render(
      <TestWrapper initialValues={[[viewerRoadmapAtom, mockRoadmap]]}>
        <CardListMode />
      </TestWrapper>,
    );
    expect(screen.getByText('First Node')).toBeTruthy();
    expect(screen.getByText('Second Node')).toBeTruthy();
  });

  it('renders sequential index numbers for cards', () => {
    render(
      <TestWrapper initialValues={[[viewerRoadmapAtom, mockRoadmap]]}>
        <CardListMode />
      </TestWrapper>,
    );
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('renders description when present', () => {
    render(
      <TestWrapper initialValues={[[viewerRoadmapAtom, mockRoadmap]]}>
        <CardListMode />
      </TestWrapper>,
    );
    expect(screen.getByText('desc one')).toBeTruthy();
  });

  it('renders 보기 buttons for each card', async () => {
    render(
      <TestWrapper initialValues={[[viewerRoadmapAtom, mockRoadmap]]}>
        <CardListMode />
      </TestWrapper>,
    );
    const viewButtons = screen.getAllByText('보기');
    expect(viewButtons).toHaveLength(2);
  });

  it('does not render non-jagalchi-node type nodes', () => {
    const sectionNode: RoadmapNode = {
      id: 's1',
      type: 'jagalchi-section',
      position: { x: 0, y: 0 },
      data: { title: 'Section', variant: 'white', isLocked: false },
    } as RoadmapNode;
    const roadmapWithSection = {
      ...mockRoadmap,
      nodes: [makeNode('n1', 'Only Node'), sectionNode],
    };
    render(
      <TestWrapper initialValues={[[viewerRoadmapAtom, roadmapWithSection]]}>
        <CardListMode />
      </TestWrapper>,
    );
    const viewButtons = screen.getAllByText('보기');
    expect(viewButtons).toHaveLength(1);
  });
});
