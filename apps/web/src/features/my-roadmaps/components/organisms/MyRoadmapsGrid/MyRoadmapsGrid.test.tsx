import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const pushMock = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { MyRoadmapsGrid } from './index';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe('MyRoadmapsGrid', () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  const mockRoadmaps = [
    { id: '11111111-1111-4111-8111-111111111111', title: 'Roadmap 1' },
    { id: '22222222-2222-4222-8222-222222222222', title: 'Roadmap 2' },
    { id: '33333333-3333-4333-8333-333333333333', title: 'Roadmap 3' },
  ];

  it('renders correctly', () => {
    render(<MyRoadmapsGrid roadmaps={mockRoadmaps} />, { wrapper });
    expect(screen.getByText('Roadmap 1')).toBeDefined();
    expect(screen.getByText('Roadmap 2')).toBeDefined();
    expect(screen.getByText('Roadmap 3')).toBeDefined();
  });

  it('renders empty state correctly', () => {
    render(<MyRoadmapsGrid roadmaps={[]} />, { wrapper });
    expect(screen.queryByText('Roadmap 1')).toBeNull();
    expect(screen.getByText('아직 실행 과제가 없습니다')).toBeInTheDocument();
  });

  it('opens roadmap when a card is clicked', async () => {
    const user = userEvent.setup();
    render(<MyRoadmapsGrid roadmaps={mockRoadmaps} />, { wrapper });

    await user.click(screen.getByRole('article', { name: 'Roadmap 1' }));

    expect(pushMock).toHaveBeenCalledWith('/editor/11111111-1111-4111-8111-111111111111');
  });

  it('opens roadmap with keyboard enter and space', async () => {
    const user = userEvent.setup();
    render(<MyRoadmapsGrid roadmaps={mockRoadmaps} />, { wrapper });

    const card = screen.getByRole('article', { name: 'Roadmap 2' });
    card.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(pushMock).toHaveBeenCalledTimes(2);
    expect(pushMock).toHaveBeenNthCalledWith(1, '/editor/22222222-2222-4222-8222-222222222222');
    expect(pushMock).toHaveBeenNthCalledWith(2, '/editor/22222222-2222-4222-8222-222222222222');
  });

  it('does not open roadmap when more menu is clicked', async () => {
    const user = userEvent.setup();
    render(<MyRoadmapsGrid roadmaps={mockRoadmaps} />, { wrapper });

    await user.click(screen.getAllByLabelText('더 보기')[0]);

    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByText('이름수정')).toBeInTheDocument();
  });
});
