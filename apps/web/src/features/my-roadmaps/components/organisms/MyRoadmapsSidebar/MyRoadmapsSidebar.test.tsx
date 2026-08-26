import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider, useAtomValue } from 'jotai';
import { describe, expect, it, vi } from 'vitest';

import { searchQueryAtom } from '../../../stores/my-roadmaps.atoms';

import { MyRoadmapsSidebar } from './index';

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <Provider>{ui}</Provider>
    </QueryClientProvider>,
  );
};

function SearchQueryProbe() {
  const searchQuery = useAtomValue(searchQueryAtom);
  return <span data-testid="search-query">{searchQuery}</span>;
}

describe('MyRoadmapsSidebar', () => {
  it('renders all sidebar categories', () => {
    renderWithProvider(<MyRoadmapsSidebar />);
    expect(screen.getByText('최근 실행')).toBeInTheDocument();
    expect(screen.getByText('내 실행 과제')).toBeInTheDocument();
    expect(screen.getByText('공유받은 과제')).toBeInTheDocument();
    expect(screen.getByText('즐겨찾기')).toBeInTheDocument();
  });

  it('clicking a category changes the active category', async () => {
    const user = userEvent.setup();
    renderWithProvider(<MyRoadmapsSidebar />);

    const recentButton = screen.getByText('최근 실행').closest('button')!;
    await user.click(recentButton);
    expect(recentButton).toHaveClass('bg-accent');

    const myRoadmapButton = screen.getByText('내 실행 과제').closest('button')!;
    expect(myRoadmapButton).not.toHaveClass('bg-accent');
  });

  it('updates shared search query atom from sidebar search input', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <>
        <MyRoadmapsSidebar />
        <SearchQueryProbe />
      </>,
    );

    await user.type(screen.getByPlaceholderText('과제·폴더 검색'), '프론트엔드');

    expect(screen.getByTestId('search-query')).toHaveTextContent('프론트엔드');
  });

  it('calls profile click handler from user area', async () => {
    const user = userEvent.setup();
    const handleProfileClick = vi.fn();
    renderWithProvider(
      <MyRoadmapsSidebar
        onProfileClick={handleProfileClick}
        userEmail="kim@example.com"
        userName="김선배"
      />,
    );

    await user.click(screen.getByRole('button', { name: '프로필 보기' }));

    expect(handleProfileClick).toHaveBeenCalledTimes(1);
    expect(screen.getByText('김선배')).toBeInTheDocument();
    expect(screen.getByText('kim@example.com')).toBeInTheDocument();
  });
});
