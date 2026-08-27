import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RoadmapAiModal } from '.';
import { edgesAtom, nodesAtom } from '../../../stores/editor-atoms';

const mocks = vi.hoisted(() => ({
  runAiJob: vi.fn(),
}));

vi.mock('@/api/ai-jobs', () => mocks);

describe('RoadmapAiModal', () => {
  const mockOnClose = vi.fn();
  const generatedRoadmap = {
    roadmap_id: 'generated-1',
    title: 'React 로드맵',
    description: 'React를 배우는 경로',
    tags: ['react'],
    nodes: [
      { node_id: 'react-basics', title: 'React 기초', tags: ['react'] },
      { node_id: 'react-hooks', title: 'React Hooks', tags: ['react'] },
    ],
    edges: [{ source: 'react-basics', target: 'react-hooks' }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.runAiJob.mockResolvedValue(generatedRoadmap);
  });

  const renderModal = (props = {}, store = createStore()) => {
    const result = render(
      <JotaiProvider store={store}>
        <RoadmapAiModal isOpen={true} onClose={mockOnClose} mode="generate" {...props} />
      </JotaiProvider>,
    );
    return { ...result, store };
  };

  it('renders without crashing', () => {
    const { container } = renderModal();
    expect(container).toBeInTheDocument();
  });

  it('renders generation form when mode is generate', () => {
    renderModal({ mode: 'generate' });
    expect(screen.getByText('AI 실행 과제 생성')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/어떤 결과물을 만들고 싶으신가요/)).toBeInTheDocument();
  });

  it('renders modification form when mode is modify', () => {
    renderModal({ mode: 'modify' });
    expect(screen.getByText('AI 실행 과제 수정')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/실행 과제를 어떻게 수정하고 싶으신가요/),
    ).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText('AI 실행 과제 생성')).not.toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderModal();

    const cancelButton = screen.getByText('취소');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('generates and appends canonical AI job nodes and edges', async () => {
    const user = userEvent.setup();
    const { store } = renderModal({ mode: 'generate' });

    const textarea = screen.getByPlaceholderText(/어떤 결과물을 만들고 싶으신가요/);
    await user.type(textarea, 'React 로드맵');

    const submitButton = screen.getByText('생성');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mocks.runAiJob).toHaveBeenCalledWith('roadmap_generation', {
        goal: 'React 로드맵',
        max_nodes: 6,
      });
    });

    await waitFor(() => {
      expect(store.get(nodesAtom)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'react-basics',
            data: expect.objectContaining({ label: 'React 기초' }),
          }),
          expect.objectContaining({
            id: 'react-hooks',
            data: expect.objectContaining({ label: 'React Hooks' }),
          }),
        ]),
      );
      expect(store.get(edgesAtom)).toEqual([
        expect.objectContaining({ source: 'react-basics', target: 'react-hooks' }),
      ]);
    });
  });

  it('generates and replaces graph nodes through the canonical AI job boundary when modifying', async () => {
    const user = userEvent.setup();
    const store = createStore();
    store.set(nodesAtom, [
      {
        id: 'existing-node',
        type: 'jagalchi-node',
        position: { x: 0, y: 0 },
        data: {
          label: '기존 노드',
          description: '',
          resources: [],
          variant: 'white',
          isLocked: false,
        },
      },
    ]);
    const { store: renderedStore } = renderModal({ mode: 'modify' }, store);

    const textarea = screen.getByPlaceholderText(/실행 과제를 어떻게 수정하고 싶으신가요/);
    await user.type(textarea, '난이도를 낮춰주세요');

    const submitButton = screen.getByText('수정');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mocks.runAiJob).toHaveBeenCalledWith('roadmap_generation', {
        goal: '현재 노드: 기존 노드. 수정 요청: 난이도를 낮춰주세요',
        max_nodes: 6,
      });
    });

    await waitFor(() => {
      expect(renderedStore.get(nodesAtom)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'react-basics' }),
          expect.objectContaining({ id: 'react-hooks' }),
        ]),
      );
      expect(renderedStore.get(nodesAtom)).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: 'existing-node' })]),
      );
      expect(renderedStore.get(edgesAtom)).toEqual([
        expect.objectContaining({ source: 'react-basics', target: 'react-hooks' }),
      ]);
    });
  });
});
