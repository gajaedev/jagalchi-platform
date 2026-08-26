import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

import { MyRoadmapsToolbar } from './index';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <Provider>{ui}</Provider>
    </QueryClientProvider>,
  );
};

describe('MyRoadmapsToolbar', () => {
  it('renders root breadcrumb when no path', () => {
    renderWithProvider(<MyRoadmapsToolbar />);
    expect(screen.getByText('전체 실행 과제')).toBeDefined();
  });

  it('renders search input', () => {
    renderWithProvider(<MyRoadmapsToolbar />);
    expect(screen.getByPlaceholderText('실행 과제 검색')).toBeDefined();
  });

  it('renders action buttons', () => {
    renderWithProvider(<MyRoadmapsToolbar />);
    expect(screen.getByRole('button', { name: '새 과제' })).toBeDefined();
  });

  it('toggles filter box when filter button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProvider(<MyRoadmapsToolbar />);
    const filterButton = screen.getByRole('button', { name: '실행 과제 필터' });

    await user.click(filterButton);
    expect(screen.getByText('정렬순서')).toBeInTheDocument();

    await user.click(filterButton);
    expect(screen.queryByText('정렬순서')).not.toBeInTheDocument();
  });

  it('opens AddRoadmapModal when 실행 과제 is selected from the new menu', async () => {
    const user = userEvent.setup();
    renderWithProvider(<MyRoadmapsToolbar />);
    const newButton = screen.getByRole('button', { name: '새 과제' });

    await user.click(newButton);

    const roadmapOption = await screen.findByText('실행 과제');
    await user.click(roadmapOption);

    expect(screen.getByText('실행 과제 추가')).toBeInTheDocument();
  });

  it('opens AddDirectoryModal when 과제 폴더 is selected from the new menu', async () => {
    const user = userEvent.setup();
    renderWithProvider(<MyRoadmapsToolbar />);
    const newButton = screen.getByRole('button', { name: '새 과제' });

    await user.click(newButton);

    const directoryOption = await screen.findByText('과제 폴더');
    await user.click(directoryOption);

    expect(screen.getByText('디렉토리 추가')).toBeInTheDocument();
  });
});
