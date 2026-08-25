import { render, screen } from '@testing-library/react';
import { Provider } from 'jotai';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock('@/hooks/use-fork-tree', () => ({ useForkTree: vi.fn() }));

import { VIEWER_MESSAGES } from '@/constants/messages';
import { useForkTree } from '@/hooks/use-fork-tree';

import { ForkTreeDialog } from './index';

const roadmapId = '11111111-1111-4111-8111-111111111111';
const mockForkTree = {
  id: roadmapId,
  title: 'Original Roadmap',
  ownerId: '42424242-4242-4242-8242-424242424242',
  ownerName: 'alice',
  forkCount: 2,
  children: [
    {
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Forked Roadmap',
      ownerId: '43434343-4343-4343-8343-434343434343',
      ownerName: 'bob',
      forkCount: 0,
      children: [],
    },
  ],
};

function renderDialog() {
  return render(
    <Provider>
      <ForkTreeDialog roadmapId={roadmapId} />
    </Provider>,
  );
}

describe('ForkTreeDialog', () => {
  it('renders trigger button', () => {
    vi.mocked(useForkTree).mockReturnValue({ data: undefined, isLoading: false } as never);
    renderDialog();
    expect(screen.getByText(VIEWER_MESSAGES.FORK_TREE_TITLE)).toBeInTheDocument();
  });

  it('shows empty state when no fork tree', async () => {
    vi.mocked(useForkTree).mockReturnValue({ data: null, isLoading: false } as never);
    renderDialog();
    screen.getByText(VIEWER_MESSAGES.FORK_TREE_TITLE).click();
    expect(await screen.findByText(VIEWER_MESSAGES.FORK_TREE_EMPTY)).toBeInTheDocument();
  });

  it('renders fork tree nodes', async () => {
    vi.mocked(useForkTree).mockReturnValue({ data: mockForkTree, isLoading: false } as never);
    renderDialog();
    screen.getByText(VIEWER_MESSAGES.FORK_TREE_TITLE).click();
    expect(await screen.findByText('Original Roadmap')).toBeInTheDocument();
    expect(screen.getByText('Forked Roadmap')).toBeInTheDocument();
    expect(screen.getByText('@alice')).toBeInTheDocument();
    expect(screen.getByText('@bob')).toBeInTheDocument();
  });
});
