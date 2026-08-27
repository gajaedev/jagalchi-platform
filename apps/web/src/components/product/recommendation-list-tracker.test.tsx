import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const capture = vi.hoisted(() => vi.fn(() => true));

vi.mock('@/lib/analytics/client', () => ({ capture }));

import { RecommendationListTracker } from './recommendation-list-tracker';

describe('RecommendationListTracker', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    [0, '0'],
    [3, '1-3'],
    [4, '4+'],
  ] as const)('captures the bounded result count for %s recommendations', async (count, bucket) => {
    render(<RecommendationListTracker source="explore" resultCount={count} />);

    await waitFor(() =>
      expect(capture).toHaveBeenCalledWith('recommendation_list_viewed', {
        source: 'explore',
        result_count_bucket: bucket,
      }),
    );
  });
});
