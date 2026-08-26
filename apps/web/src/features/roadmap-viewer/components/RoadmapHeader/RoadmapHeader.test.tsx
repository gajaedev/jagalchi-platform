import React from 'react';

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockBack = vi.fn();
const mockPush = vi.fn();
const mockForkMutate = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

vi.mock('@/hooks/use-fork-status', () => ({
  useForkStatus: () => ({ data: undefined }),
}));

vi.mock('@/hooks/use-fork-roadmap', () => ({
  useForkRoadmap: () => ({ mutate: mockForkMutate, isPending: false }),
}));

import { RoadmapHeader } from './index';

describe('RoadmapHeader', () => {
  it('renders the default roadmap title', () => {
    render(<RoadmapHeader />);
    expect(screen.getByText('새 실행 과제')).toBeTruthy();
  });

  it('renders a custom roadmap title', () => {
    render(<RoadmapHeader roadmapTitle="My Roadmap" />);
    expect(screen.getByText('My Roadmap')).toBeTruthy();
  });

  it('renders the back button', () => {
    render(<RoadmapHeader />);
    expect(screen.getByRole('button', { name: '뒤로가기' })).toBeTruthy();
  });

  it('renders the search input with placeholder', () => {
    render(<RoadmapHeader />);
    expect(screen.getByPlaceholderText('실행 단계 검색')).toBeTruthy();
  });

  it('hides the AI feedback button while AI features are disabled', () => {
    render(<RoadmapHeader />);
    expect(screen.queryByText('AI 실행 피드백')).toBeNull();
  });

  it('calls router.back when back button is clicked', async () => {
    mockBack.mockClear();
    render(<RoadmapHeader />);
    await userEvent.click(screen.getByRole('button', { name: '뒤로가기' }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
