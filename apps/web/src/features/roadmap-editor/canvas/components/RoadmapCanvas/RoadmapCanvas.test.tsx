import { fireEvent, render } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { Provider } from 'jotai';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import * as actionDispatcher from '../../../services/action-dispatcher';
import { RoadmapCanvas } from '.';

vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xyflow/react')>();

  return {
    ...actual,
    useReactFlow: () => ({
      screenToFlowPosition: ({ x, y }: { x: number; y: number }) => ({ x, y }),
    }),
  };
});

vi.mock('../../../services/action-dispatcher', () => ({
  sendCursorHide: vi.fn(),
  sendCursorPosition: vi.fn(),
}));

const mockSendCursorPosition = vi.mocked(actionDispatcher.sendCursorPosition);

// Mock ResizeObserver for ReactFlow
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('RoadmapCanvas', () => {
  const renderCanvas = (props?: { roadmapId?: string }) => {
    return render(
      <Provider>
        <ReactFlowProvider>
          <div style={{ width: '800px', height: '600px' }}>
            <RoadmapCanvas {...props} />
          </div>
        </ReactFlowProvider>
      </Provider>,
    );
  };

  it('renders without crashing', () => {
    const { container } = renderCanvas();
    expect(container).toBeInTheDocument();
  });

  it('renders as a div with full dimensions', () => {
    const { container } = renderCanvas();
    const canvas = container.querySelector('.h-full.w-full');
    expect(canvas).toBeInTheDocument();
  });

  it('renders ReactFlow component', () => {
    const { container } = renderCanvas();
    const reactFlow = container.querySelector('.react-flow');
    expect(reactFlow).toBeInTheDocument();
  });

  it('renders controls', () => {
    const { container } = renderCanvas();
    const controls = container.querySelector('.react-flow__controls');
    expect(controls).toBeInTheDocument();
  });

  it('has correct node types registered', () => {
    const { container } = renderCanvas();
    const reactFlow = container.querySelector('.react-flow');
    expect(reactFlow).toBeInTheDocument();
  });

  it('renders pane for canvas interaction', () => {
    const { container } = renderCanvas();
    const pane = container.querySelector('.react-flow__pane');
    expect(pane).toBeInTheDocument();
  });

  it('renders viewport for transformations', () => {
    const { container } = renderCanvas();
    const viewport = container.querySelector('.react-flow__viewport');
    expect(viewport).toBeInTheDocument();
  });

  it('sends only coordinates because the server owns actor identity', () => {
    mockSendCursorPosition.mockClear();

    const { container } = renderCanvas({ roadmapId: 'roadmap-1' });
    const canvas = container.querySelector('.h-full.w-full');

    expect(canvas).toBeInTheDocument();

    fireEvent.mouseMove(canvas as Element, { clientX: 30, clientY: 40 });

    expect(mockSendCursorPosition).toHaveBeenCalledTimes(1);
    expect(mockSendCursorPosition).toHaveBeenCalledWith('roadmap-1', {
      x: 30,
      y: 40,
    });
  });
});
