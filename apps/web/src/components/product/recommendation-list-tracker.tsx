'use client';

import { useEffect, useRef } from 'react';

import { capture } from '@/lib/analytics/client';
import type { RecommendationSource } from '@/lib/analytics/events';

function getResultCountBucket(count: number): '0' | '1-3' | '4+' {
  if (count <= 0) return '0';
  if (count <= 3) return '1-3';
  return '4+';
}

export function RecommendationListTracker({
  resultCount,
  source,
}: {
  resultCount: number;
  source: RecommendationSource;
}) {
  const captured = useRef(false);

  useEffect(() => {
    if (captured.current) return;
    if (
      capture('recommendation_list_viewed', {
        source,
        result_count_bucket: getResultCountBucket(resultCount),
      })
    ) {
      captured.current = true;
    }
  }, [resultCount, source]);

  return null;
}
