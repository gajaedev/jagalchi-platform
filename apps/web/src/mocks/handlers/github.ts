import { http, HttpResponse } from 'msw';

import type {
  GithubInstallationClaim,
  GithubPullRequest,
  GithubRepository,
  GithubSetupState,
} from '@/api/github';

type MockGithubState = 'disconnected' | 'connected' | 'revoked' | 'rate-limited';

const INSTALLATION_ID = 'installation-personal-read-only-1';
export const MOCK_GITHUB_REPOSITORY_ID = '90071992547409931234';

const repositories: GithubRepository[] = [
  {
    repositoryId: MOCK_GITHUB_REPOSITORY_ID,
    name: 'jagalchi-web',
    fullName: 'mock-developer/jagalchi-web',
    private: false,
  },
  {
    repositoryId: '424242',
    name: 'accessibility-lab',
    fullName: 'mock-developer/accessibility-lab',
    private: false,
  },
];

const pullRequests = new Map<string, GithubPullRequest[]>([
  [
    MOCK_GITHUB_REPOSITORY_ID,
    [
      {
        repositoryId: MOCK_GITHUB_REPOSITORY_ID,
        pullNumber: 42,
        title: '테스트 가능한 결제 흐름 추가',
        state: 'CLOSED',
        merged: true,
        baseBranch: 'main',
        headSha: '1111111111111111111111111111111111111111',
        htmlUrl: 'https://github.com/mock-developer/jagalchi-web/pull/42',
      },
      {
        repositoryId: MOCK_GITHUB_REPOSITORY_ID,
        pullNumber: 43,
        title: '실패한 검증 경로',
        state: 'OPEN',
        merged: false,
        baseBranch: 'main',
        headSha: '2222222222222222222222222222222222222222',
        htmlUrl: 'https://github.com/mock-developer/jagalchi-web/pull/43',
      },
      {
        repositoryId: MOCK_GITHUB_REPOSITORY_ID,
        pullNumber: 44,
        title: '새 head가 생긴 검증 경로',
        state: 'CLOSED',
        merged: true,
        baseBranch: 'main',
        headSha: '3333333333333333333333333333333333333333',
        htmlUrl: 'https://github.com/mock-developer/jagalchi-web/pull/44',
      },
    ],
  ],
  [
    '424242',
    [
      {
        repositoryId: '424242',
        pullNumber: 7,
        title: '키보드 탐색 개선',
        state: 'CLOSED',
        merged: true,
        baseBranch: 'main',
        headSha: '7777777777777777777777777777777777777777',
        htmlUrl: 'https://github.com/mock-developer/accessibility-lab/pull/7',
      },
    ],
  ],
]);

function githubState(request: Request): MockGithubState {
  const explicit = request.headers.get('x-mock-github-state')?.toLowerCase();
  const cookie = request.headers
    .get('cookie')
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('mock-github-state='))
    ?.split('=')[1]
    ?.toLowerCase();
  const value = explicit ?? cookie;
  return value === 'disconnected' || value === 'revoked' || value === 'rate-limited'
    ? value
    : 'connected';
}

function error(status: number, code: string, message: string) {
  return HttpResponse.json({ statusCode: status, code, message }, { status });
}

function requireConnection(request: Request) {
  const state = githubState(request);
  if (state === 'rate-limited') {
    return error(429, 'GITHUB_RATE_LIMITED', 'GitHub request rate limit reached');
  }
  if (state === 'revoked') {
    return error(409, 'GITHUB_INSTALLATION_INACTIVE', 'GitHub installation is inactive');
  }
  if (state === 'disconnected') {
    return error(409, 'GITHUB_IDENTITY_REQUIRED', 'GitHub App connection is required');
  }
  return null;
}

export const githubHandlers = [
  http.get('/api/github/setup', ({ request }) => {
    const state = githubState(request);
    if (state === 'rate-limited') {
      return error(429, 'GITHUB_RATE_LIMITED', 'GitHub request rate limit reached');
    }

    const setup: GithubSetupState =
      state === 'disconnected'
        ? { hasVerifiedIdentity: true, installation: null, repositories: [] }
        : {
            hasVerifiedIdentity: true,
            installation: {
              id: INSTALLATION_ID,
              status: state === 'revoked' ? 'REVOKED' : 'ACTIVE',
              accountId: '90071992547409931234',
            },
            repositories: state === 'connected' ? repositories : [],
          };
    return HttpResponse.json(setup);
  }),

  http.post('/api/github/installation-claims', async ({ request }) => {
    const input = (await request.json()) as { returnTo?: unknown };
    if (
      input.returnTo !== undefined &&
      (typeof input.returnTo !== 'string' ||
        !input.returnTo.startsWith('/') ||
        input.returnTo.startsWith('//'))
    ) {
      return error(400, 'GITHUB_INVALID_RETURN_PATH', 'Return path must be relative');
    }
    const claim: GithubInstallationClaim = {
      setupUrl: 'https://github.com/apps/jagalchi-dev/installations/new',
      stateExpiresAt: '2026-08-25T09:10:00.000Z',
    };
    return HttpResponse.json(claim, { status: 201 });
  }),

  http.get('/api/github/repositories', ({ request }) => {
    const connectionError = requireConnection(request);
    return connectionError ?? HttpResponse.json(repositories);
  }),

  http.get<{ repositoryId: string }>(
    '/api/github/repositories/:repositoryId/pulls',
    ({ params, request }) => {
      const connectionError = requireConnection(request);
      if (connectionError) return connectionError;
      const repositoryId = String(params.repositoryId);
      const pulls = pullRequests.get(repositoryId);
      if (!pulls) {
        return error(
          404,
          'GITHUB_REPOSITORY_NOT_AUTHORIZED',
          'Repository is not authorized for this installation',
        );
      }
      return HttpResponse.json(pulls);
    },
  ),
];
