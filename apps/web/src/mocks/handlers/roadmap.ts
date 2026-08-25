import { http, HttpResponse } from 'msw';

import type { RoadmapRecord } from '@/api/roadmap-domain';
import type { Roadmap } from '@/types/roadmap.types';

import { MOCK_ROADMAPS } from '../fixtures/roadmaps';

const toRecord = (roadmap: Roadmap): RoadmapRecord => ({
  id: String(roadmap.id),
  ownerId: String(roadmap.author?.id ?? 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  title: roadmap.title,
  description: roadmap.description ?? '',
  tags: [],
  visibility: roadmap.isPublic ? 'PUBLIC' : 'PRIVATE',
  graph: {
    schemaVersion: 1,
    nodes: roadmap.nodes,
    edges: roadmap.edges,
  },
  version: 1,
  createdAt: roadmap.createdAt,
  updatedAt: roadmap.updatedAt,
});

const roadmapStore: RoadmapRecord[] = MOCK_ROADMAPS.map(toRecord);

const directoryStore = [
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    name: '프론트엔드',
    parentId: null as string | null,
    path: '/프론트엔드',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    name: '백엔드',
    parentId: null as string | null,
    path: '/백엔드',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    name: 'React',
    parentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    path: '/프론트엔드/React',
  },
];

function paginate(request: Request, records: RoadmapRecord[]) {
  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get('page') ?? '1'), 1);
  const size = Math.max(Number(url.searchParams.get('size') ?? '20'), 1);
  const search = url.searchParams.get('search')?.trim().toLowerCase();
  const filtered = search
    ? records.filter(
        (record) =>
          record.title.toLowerCase().includes(search) ||
          record.description.toLowerCase().includes(search),
      )
    : records;
  const start = (page - 1) * size;
  return {
    items: filtered.slice(start, start + size),
    page,
    size,
    total: filtered.length,
  };
}

function findRoadmap(id: string) {
  return roadmapStore.find((roadmap) => roadmap.id === id);
}

export const roadmapHandlers = [
  http.get('/api/roadmaps/public', ({ request }) => {
    const publicRoadmaps = roadmapStore.filter((roadmap) => roadmap.visibility === 'PUBLIC');
    return HttpResponse.json(paginate(request, publicRoadmaps));
  }),

  http.get<{ id: string }>('/api/roadmaps/public/:id', ({ params }) => {
    const roadmap = findRoadmap(params.id);
    if (!roadmap || roadmap.visibility !== 'PUBLIC') {
      return HttpResponse.json({ message: '로드맵을 찾을 수 없습니다' }, { status: 404 });
    }
    return HttpResponse.json(roadmap);
  }),

  http.get('/api/roadmaps', ({ request }) => HttpResponse.json(paginate(request, roadmapStore))),

  http.get<{ id: string }>('/api/roadmaps/:id', ({ params }) => {
    const roadmap = findRoadmap(params.id);
    if (!roadmap) {
      return HttpResponse.json({ message: '로드맵을 찾을 수 없습니다' }, { status: 404 });
    }
    return HttpResponse.json(roadmap);
  }),

  http.post('/api/roadmaps', async ({ request }) => {
    const body = (await request.json()) as Partial<
      Pick<RoadmapRecord, 'title' | 'description' | 'tags' | 'visibility' | 'graph'>
    >;
    const now = new Date().toISOString();
    const roadmap: RoadmapRecord = {
      id: crypto.randomUUID(),
      ownerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      title: body.title?.trim() || '새 로드맵',
      description: body.description ?? '',
      tags: body.tags ?? [],
      visibility: body.visibility ?? 'PRIVATE',
      graph: body.graph ?? { schemaVersion: 1, nodes: [], edges: [] },
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    roadmapStore.push(roadmap);
    return HttpResponse.json(roadmap, { status: 201 });
  }),

  http.patch<{ id: string }>('/api/roadmaps/:id', async ({ params, request }) => {
    const index = roadmapStore.findIndex((roadmap) => roadmap.id === params.id);
    if (index < 0) {
      return HttpResponse.json({ message: '로드맵을 찾을 수 없습니다' }, { status: 404 });
    }
    const body = (await request.json()) as Partial<
      Pick<RoadmapRecord, 'title' | 'description' | 'tags' | 'visibility' | 'graph'>
    >;
    const current = roadmapStore[index]!;
    const updated: RoadmapRecord = {
      ...current,
      ...body,
      id: current.id,
      ownerId: current.ownerId,
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
    };
    roadmapStore[index] = updated;
    return HttpResponse.json(updated);
  }),

  http.delete<{ id: string }>('/api/roadmaps/:id', ({ params }) => {
    const index = roadmapStore.findIndex((roadmap) => roadmap.id === params.id);
    if (index < 0) {
      return HttpResponse.json({ message: '로드맵을 찾을 수 없습니다' }, { status: 404 });
    }
    roadmapStore.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get<{ id: string }>('/api/roadmaps/:id/events', ({ params, request }) => {
    if (!findRoadmap(params.id)) {
      return HttpResponse.json({ message: '로드맵을 찾을 수 없습니다' }, { status: 404 });
    }
    const after = Number(new URL(request.url).searchParams.get('after') ?? '0');
    return HttpResponse.json({ events: [], currentSequence: after });
  }),

  http.post<{ roadmapId: string }>('/api/roadmaps/:roadmapId/fork', ({ params }) => {
    const source = findRoadmap(params.roadmapId);
    if (!source) {
      return HttpResponse.json({ message: '로드맵을 찾을 수 없습니다' }, { status: 404 });
    }
    const now = new Date().toISOString();
    const fork: RoadmapRecord = {
      ...structuredClone(source),
      id: crypto.randomUUID(),
      ownerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      title: `${source.title} 포크`,
      visibility: 'PRIVATE',
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    roadmapStore.push(fork);
    return HttpResponse.json(fork, { status: 201 });
  }),

  http.get<{ roadmapId: string }>('/api/roadmaps/:roadmapId/fork-tree', ({ params }) =>
    HttpResponse.json({
      id: params.roadmapId,
      title: findRoadmap(params.roadmapId)?.title ?? '원본 로드맵',
      ownerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      ownerName: '김선배',
      forkCount: 0,
      children: [],
    }),
  ),

  http.get<{ roadmapId: string }>('/api/roadmaps/:roadmapId/fork-status', ({ params }) =>
    HttpResponse.json({
      roadmapId: params.roadmapId,
      forkCount: 0,
      originalRoadmapId: null,
      originalRoadmapTitle: null,
      forkedByCurrentUser: false,
    }),
  ),

  http.get('/api/directories/tree', () =>
    HttpResponse.json(
      directoryStore.map((directory) => ({
        id: directory.id,
        name: directory.name,
        path: directory.path,
        roadmaps: [],
      })),
    ),
  ),

  http.post('/api/directories', async ({ request }) => {
    const body = (await request.json()) as { name: string; parentId?: string };
    const parent = body.parentId
      ? directoryStore.find((directory) => directory.id === body.parentId)
      : null;
    const directory = {
      id: crypto.randomUUID(),
      name: body.name,
      parentId: body.parentId ?? null,
      path: parent ? `${parent.path}/${body.name}` : `/${body.name}`,
    };
    directoryStore.push(directory);
    return HttpResponse.json(
      { ...directory, createdAt: new Date().toISOString() },
      { status: 201 },
    );
  }),

  http.patch<{ directoryId: string }>(
    '/api/directories/:directoryId',
    async ({ params, request }) => {
      const directory = directoryStore.find((item) => item.id === params.directoryId);
      if (!directory) {
        return HttpResponse.json({ message: '디렉토리를 찾을 수 없습니다' }, { status: 404 });
      }
      const body = (await request.json()) as { name: string };
      directory.name = body.name;
      return HttpResponse.json({ ...directory, createdAt: new Date().toISOString() });
    },
  ),

  http.delete<{ directoryId: string }>('/api/directories/:directoryId', ({ params }) => {
    const index = directoryStore.findIndex((directory) => directory.id === params.directoryId);
    if (index < 0) {
      return HttpResponse.json({ message: '디렉토리를 찾을 수 없습니다' }, { status: 404 });
    }
    directoryStore.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get<{ roadmapId: string }>('/api/roadmaps/:roadmapId/my-progress', ({ params }) =>
    HttpResponse.json({
      roadmapId: params.roadmapId,
      totalNodes: 5,
      completedNodes: 2,
      progressPercentage: 40,
      completedNodeIds: ['node-1', 'node-2'],
      updatedAt: new Date().toISOString(),
    }),
  ),

  http.post<{ roadmapId: string; nodeId: string }>(
    '/api/roadmaps/:roadmapId/nodes/:nodeId/complete',
    async ({ params, request }) => {
      const body = (await request.json()) as { isCompleted: boolean };
      return HttpResponse.json({
        nodeId: params.nodeId,
        isCompleted: body.isCompleted,
        roadmapProgress: body.isCompleted ? 60 : 40,
        completedAt: body.isCompleted ? new Date().toISOString() : null,
      });
    },
  ),
];

export const resetRoadmapStore = (): void => {
  roadmapStore.splice(0, roadmapStore.length, ...MOCK_ROADMAPS.map(toRecord));
};
