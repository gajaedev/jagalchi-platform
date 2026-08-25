import type { RoadmapSummary } from '@/types/roadmap.types';

/** @deprecated Generated Storybook fixture shape. Product APIs use RoadmapSummary UUIDs. */
export type RoadmapData = Omit<RoadmapSummary, 'id'> & { id: number };
