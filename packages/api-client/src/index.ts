export interface ApiTransport {
  request<T>(path: string, init?: RequestInit): Promise<T>;
}

import type { components } from './schema.generated.js';

export type ProjectRunProjection = components['schemas']['ProjectRunProjectionDto'];
export type NativeAuthSession = components['schemas']['NativeAuthResponse'];
export type RealtimeTicket = components['schemas']['RealtimeTicketResponseDto'];

export interface WebSessionUser {
  id: string;
  email: string;
  name: string;
  roles: readonly string[];
}

export interface WebSessionResponse {
  authenticated: true;
  user?: WebSessionUser;
}

export class ApiResponseError extends Error {
  constructor(
    public readonly status: number,
    public readonly code?: string,
    message = 'API request failed',
  ) {
    super(message);
    this.name = 'ApiResponseError';
  }
}

export function projectRunQueryKey(runId: string): readonly ['project-run', string] {
  return ['project-run', runId] as const;
}

export function createApiTransport(
  baseUrl: string,
  fetchImplementation: typeof globalThis.fetch,
  defaults: RequestInit = {},
): ApiTransport {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  return {
    async request<T>(path: string, init: RequestInit = {}): Promise<T> {
      const headers = new Headers(defaults.headers);
      new Headers(init.headers).forEach((value, name) => headers.set(name, value));
      const response = await fetchImplementation(`${normalizedBaseUrl}/${path.replace(/^\//, '')}`, {
        ...defaults,
        ...init,
        headers,
      });
      if (!response.ok) {
        const error = (await response.json().catch(() => undefined)) as
          | { code?: string; message?: string }
          | undefined;
        throw new ApiResponseError(response.status, error?.code, error?.message);
      }
      return (await response.json()) as T;
    },
  };
}

export function getProjectRun(
  transport: ApiTransport,
  runId: string,
  signal?: AbortSignal,
): Promise<ProjectRunProjection> {
  return transport.request<ProjectRunProjection>(`/project-runs/${encodeURIComponent(runId)}`, {
    method: 'GET',
    signal,
  });
}
