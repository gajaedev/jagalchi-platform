import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const capture = vi.hoisted(() => vi.fn());

vi.mock('@/lib/analytics/client', () => ({ capture }));

import { RoadmapCard } from './roadmap-card';

describe('RoadmapCard analytics', () => {
  beforeEach(() => vi.clearAllMocks());

  it('captures a recommendation selection without content identifiers', async () => {
    render(
      <RoadmapCard
        title="추천 로드맵"
        description="설명"
        author="자갈치"
        href="/viewer/roadmap-id"
        analyticsSource="explore"
      />,
    );

    const link = screen.getByRole('link', { name: '추천 로드맵 실행 과제 보기' });
    link.addEventListener('click', (event) => event.preventDefault());
    await userEvent.click(link);

    expect(capture).toHaveBeenCalledWith('recommendation_selected', { source: 'explore' });
    expect(JSON.stringify(capture.mock.calls)).not.toContain('roadmap-id');
  });
});
