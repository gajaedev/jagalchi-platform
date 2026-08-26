import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getGithubSetup,
  listGithubPullRequests,
  listGithubRepositories,
  startGithubInstallationClaim,
  type GithubConnectionErrorCode,
} from '@/api/github';
import { queryKeys } from '@/lib/query-keys';

const githubKeys = {
  all: [...queryKeys.career.all, 'github'] as const,
  setup: () => [...githubKeys.all, 'setup'] as const,
  repositories: () => [...githubKeys.all, 'repositories'] as const,
  pullsRoot: () => [...githubKeys.all, 'pulls'] as const,
  pulls: (repositoryId: string | null) =>
    [...githubKeys.pullsRoot(), repositoryId ?? 'none'] as const,
};

export type GithubConnectionIssue =
  'DISCONNECTED' | 'REVOKED' | 'PERMISSION_REQUIRED' | 'NOT_FOUND' | 'RATE_LIMITED' | 'TRANSIENT';

const ERROR_ISSUES: Partial<Record<GithubConnectionErrorCode, GithubConnectionIssue>> = {
  GITHUB_IDENTITY_REQUIRED: 'PERMISSION_REQUIRED',
  GITHUB_CLAIM_EXPIRED: 'DISCONNECTED',
  GITHUB_CLAIM_REPLAYED: 'DISCONNECTED',
  GITHUB_ACCOUNT_MISMATCH: 'PERMISSION_REQUIRED',
  GITHUB_ORG_UNSUPPORTED: 'PERMISSION_REQUIRED',
  GITHUB_INSTALLATION_CONFLICT: 'PERMISSION_REQUIRED',
  GITHUB_INSTALLATION_INACTIVE: 'REVOKED',
  GITHUB_REPOSITORY_NOT_AUTHORIZED: 'PERMISSION_REQUIRED',
  GITHUB_PR_NOT_FOUND: 'NOT_FOUND',
  GITHUB_RATE_LIMITED: 'RATE_LIMITED',
  GITHUB_UNAVAILABLE: 'TRANSIENT',
  GITHUB_CONFIGURATION_ERROR: 'TRANSIENT',
};

export function getGithubConnectionIssue(error: unknown): GithubConnectionIssue {
  if (typeof error !== 'object' || error === null || !('code' in error)) return 'TRANSIENT';
  const code = (error as { code?: GithubConnectionErrorCode }).code;
  return (code && ERROR_ISSUES[code]) || 'TRANSIENT';
}

const retryTransientGithubError = (failureCount: number, error: unknown) =>
  failureCount < 2 && getGithubConnectionIssue(error) === 'TRANSIENT';

export function useGithubSetup(enabled = true) {
  return useQuery({
    queryKey: githubKeys.setup(),
    queryFn: getGithubSetup,
    enabled,
    retry: retryTransientGithubError,
  });
}

export function useGithubRepositories(enabled: boolean) {
  return useQuery({
    queryKey: githubKeys.repositories(),
    queryFn: listGithubRepositories,
    enabled,
    retry: retryTransientGithubError,
  });
}

export function useGithubPullRequests(repositoryId: string | null, enabled = true) {
  return useQuery({
    queryKey: githubKeys.pulls(repositoryId),
    queryFn: () => listGithubPullRequests(repositoryId!),
    enabled: enabled && repositoryId !== null,
    retry: retryTransientGithubError,
  });
}

export function useStartGithubInstallationClaim() {
  return useMutation({
    mutationFn: (returnTo?: string) => startGithubInstallationClaim(returnTo),
  });
}

export function useRefreshGithubSetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getGithubSetup,
    onSuccess: async (setup) => {
      queryClient.setQueryData(githubKeys.setup(), setup);
      queryClient.setQueryData(githubKeys.repositories(), setup.repositories);
      await queryClient.invalidateQueries({ queryKey: githubKeys.pullsRoot() });
    },
  });
}
