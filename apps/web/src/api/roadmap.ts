import { apiClient } from './client';

import type { RoadmapRecord } from './roadmap-domain';

// === Common Types ===

interface RoadmapOwnerResponse {
  id: string;
  nickname: string;
  profileImageUrl: string | null;
}

interface RoadmapStatsResponse {
  totalNodes: number;
  totalEdges: number;
  forkCount: number;
}

interface PageableResponse {
  page: number;
  size: number;
}

// === Roadmap Types (aligned with Roadmap Service OpenAPI spec) ===

interface CreateRoadmapRequest {
  title: string;
  description?: string;
  directoryId?: string;
  isPublic?: boolean;
  thumbnailUrl?: string;
  tags?: string[];
}

interface UpdateRoadmapRequest {
  title?: string;
  description?: string;
  isPublic?: boolean;
  thumbnailUrl?: string;
  tags?: string[];
}

interface RoadmapResponse {
  id: string;
  title: string;
  description: string | null;
  directoryId: string | null;
  ownerId: string;
  isPublic: boolean;
  viewCount: number;
  forkCount: number;
  createdAt: string;
  updatedAt: string;
}

interface RoadmapDetailResponse {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  isPublic: boolean;
  viewCount: number;
  owner: RoadmapOwnerResponse;
  stats: RoadmapStatsResponse;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

type RoadmapListItemResponse = RoadmapRecord;

interface RoadmapListResponse {
  items: RoadmapListItemResponse[];
  page: number;
  size: number;
  total: number;
}

interface RoadmapUpdateResponse {
  id: string;
  updatedAt: string;
}

interface RoadmapDeleteResponse {
  message: string;
}

// === Directory Types ===

interface DirectoryResponse {
  id: string;
  name: string;
  parentId: string | null;
  path?: string;
  createdAt: string;
}

interface RoadmapSummaryResponse {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  isPublic: boolean;
  updatedAt: string;
}

interface DirectoryTreeItem {
  id: string;
  name: string;
  path: string;
  roadmaps: RoadmapSummaryResponse[];
}

type DirectoryTreeResponse = DirectoryTreeItem[];

// === Progress Types ===

interface ProgressResponse {
  roadmapId: string;
  totalNodes: number;
  completedNodes: number;
  progressPercentage: number;
  completedNodeIds: string[];
  updatedAt: string;
}

interface NodeCompleteResponse {
  nodeId: string;
  isCompleted: boolean;
  roadmapProgress: number;
  completedAt: string | null;
}

// === Fork Types ===

interface RoadmapForkTreeResponse {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  forkCount: number;
  children: RoadmapForkTreeResponse[];
}

interface RoadmapForkStatusResponse {
  roadmapId: string;
  forkCount: number;
  originalRoadmapId: string | null;
  originalRoadmapTitle: string | null;
  forkedByCurrentUser: boolean;
}

// === Roadmap CRUD ===

export const createRoadmap = (data: CreateRoadmapRequest) =>
  apiClient.post<RoadmapResponse>('/roadmaps', data);

export const getRoadmap = (roadmapId: string) =>
  apiClient.get<RoadmapDetailResponse>(`/roadmaps/${roadmapId}`);

interface RoadmapListParams {
  page?: number;
  size?: number;
  search?: string;
  tag?: string;
}

export const getRoadmaps = (params: RoadmapListParams = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.size !== undefined) searchParams.set('size', String(params.size));
  if (params.search) searchParams.set('search', params.search);
  if (params.tag) searchParams.set('tag', params.tag);

  const qs = searchParams.toString();
  return apiClient.get<RoadmapListResponse>(`/roadmaps/mine${qs ? `?${qs}` : ''}`);
};

export const updateRoadmap = (roadmapId: string, data: UpdateRoadmapRequest) =>
  apiClient.patch<RoadmapUpdateResponse>(`/roadmaps/${roadmapId}`, data);

export const deleteRoadmap = (roadmapId: string) =>
  apiClient.delete<RoadmapDeleteResponse>(`/roadmaps/${roadmapId}`);

// === Directory ===

export const getDirectoryTree = async (): Promise<DirectoryTreeResponse> => {
  const directories = await apiClient.get<DirectoryResponse[]>('/directories/tree');
  return directories.map((directory) => ({
    id: directory.id,
    name: directory.name,
    path: directory.path ?? directory.name,
    roadmaps: [],
  }));
};

export const createDirectory = (data: { name: string; parentId?: string }) =>
  apiClient.post<DirectoryResponse>('/directories', data);

export const updateDirectory = (directoryId: string, data: { name: string }) =>
  apiClient.patch<DirectoryResponse>(`/directories/${directoryId}`, data);

interface DeleteDirectoryParams {
  mode?: string;
  targetDirectoryId?: string;
}

export const deleteDirectory = (directoryId: string, params?: DeleteDirectoryParams) => {
  const searchParams = new URLSearchParams();
  if (params?.mode) searchParams.set('mode', params.mode);
  if (params?.targetDirectoryId !== undefined)
    searchParams.set('targetDirectoryId', String(params.targetDirectoryId));

  const qs = searchParams.toString();
  return apiClient.delete<Record<string, string>>(
    `/directories/${directoryId}${qs ? `?${qs}` : ''}`,
  );
};

// === Progress ===

export const getMyProgress = (roadmapId: string) =>
  apiClient.get<ProgressResponse>(`/roadmaps/${roadmapId}/progress`);

export const completeNode = (
  roadmapId: string,
  nodeId: string,
  data: { isCompleted: boolean; link?: string },
) => apiClient.put<NodeCompleteResponse>(`/roadmaps/${roadmapId}/nodes/${nodeId}/progress`, data);

// === Fork ===

export const forkRoadmap = (roadmapId: string) =>
  apiClient.post<{ id: string }>(`/roadmaps/${roadmapId}/fork`);

export const getForkTree = (roadmapId: string) =>
  apiClient.get<RoadmapForkTreeResponse>(`/roadmaps/public/${roadmapId}/fork-tree`);

export const getForkStatus = (roadmapId: string) =>
  apiClient.get<RoadmapForkStatusResponse>(`/roadmaps/${roadmapId}/fork-status`);

// === Popular ===

interface PopularRoadmapsParams {
  page?: number;
  size?: number;
  search?: string;
  tag?: string;
}

export const getPopularRoadmaps = (params: PopularRoadmapsParams = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.size !== undefined) searchParams.set('size', String(params.size));
  if (params.search) searchParams.set('search', params.search);
  if (params.tag) searchParams.set('tag', params.tag);

  const qs = searchParams.toString();
  return apiClient.get<RoadmapListResponse>(`/roadmaps/public${qs ? `?${qs}` : ''}`);
};

// === Type Exports ===

export type {
  RoadmapOwnerResponse,
  RoadmapStatsResponse,
  PageableResponse,
  CreateRoadmapRequest,
  UpdateRoadmapRequest,
  RoadmapResponse,
  RoadmapDetailResponse,
  RoadmapListItemResponse,
  RoadmapListResponse,
  RoadmapListParams,
  RoadmapUpdateResponse,
  RoadmapDeleteResponse,
  DirectoryResponse,
  RoadmapSummaryResponse,
  DirectoryTreeItem,
  DirectoryTreeResponse,
  ProgressResponse,
  NodeCompleteResponse,
  RoadmapForkTreeResponse,
  RoadmapForkStatusResponse,
  PopularRoadmapsParams,
  DeleteDirectoryParams,
};
