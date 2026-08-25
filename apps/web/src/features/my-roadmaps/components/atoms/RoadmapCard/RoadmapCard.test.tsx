import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { RoadmapCard } from './index';

describe('RoadmapCard', () => {
  it('renders title correctly', () => {
    render(<RoadmapCard title="Test Roadmap" />);
    expect(screen.getByText('Test Roadmap')).toBeInTheDocument();
  });

  it('renders directory type correctly', () => {
    render(<RoadmapCard title="Directory Name" type="Directory" fileCount={67} />);
    expect(screen.getByText('Directory Name')).toBeInTheDocument();
    expect(screen.getByText('67개의 파일')).toBeInTheDocument();
  });

  it('renders roadmap type with author correctly', () => {
    render(<RoadmapCard title="Roadmap Name" type="Roadmap" author="홍길동" />);
    expect(screen.getByText('Roadmap Name')).toBeInTheDocument();
    expect(screen.getByText('By 홍길동')).toBeInTheDocument();
  });

  it('shows context menu with all items for roadmap type', async () => {
    const user = userEvent.setup();
    render(<RoadmapCard title="Test" type="Roadmap" />);
    await user.click(screen.getByLabelText('더 보기'));
    expect(screen.getByText('즐겨찾기')).toBeInTheDocument();
    expect(screen.getByText('이름수정')).toBeInTheDocument();
    expect(screen.getByText('파일이동')).toBeInTheDocument();
    expect(screen.getByText('삭제')).toBeInTheDocument();
  });

  it('hides 즐겨찾기 for directory type', async () => {
    const user = userEvent.setup();
    render(<RoadmapCard title="Test" type="Directory" />);
    await user.click(screen.getByLabelText('더 보기'));
    expect(screen.queryByText('즐겨찾기')).not.toBeInTheDocument();
    expect(screen.getByText('이름수정')).toBeInTheDocument();
  });

  it('calls onDelete when 삭제 clicked', async () => {
    const user = userEvent.setup();
    const handleDelete = vi.fn();
    render(<RoadmapCard title="Test" onDelete={handleDelete} />);
    await user.click(screen.getByLabelText('더 보기'));
    await user.click(screen.getByText('삭제'));
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });
});
