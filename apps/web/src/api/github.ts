import { apiClient } from './client';

export type GithubInstallationStatus = 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
export type GithubConnectionErrorCode =
  | 'GITHUB_IDENTITY_REQUIRED'
  | 'GITHUB_CLAIM_EXPIRED'
  | 'GITHUB_CLAIM_REPLAYED'
  | 'GITHUB_ACCOUNT_MISMATCH'
  | 'GITHUB_ORG_UNSUPPORTED'
  | 'GITHUB_INSTALLATION_CONFLICT'
  | 'GITHUB_INSTALLATION_INACTIVE'
  | 'GITHUB_REPOSITORY_NOT_AUTHORIZED'
  | 'GITHUB_PR_NOT_FOUND'
  | 'GITHUB_RATE_LIMITED'
  | 'GITHUB_UNAVAILABLE'
  | 'GITHUB_CONFIGURATION_ERROR';

export interface GithubRepository {
  repositoryId: string;
  name: string;
  fullName: string;
  private: boolean;
}

export interface GithubSetupState {
  hasVerifiedIdentity: boolean;
  installation: {
    id: string;
    status: GithubInstallationStatus;
    accountId: string;
  } | null;
  repositories: GithubRepository[];
}

export interface GithubInstallationClaim {
  setupUrl: string;
  stateExpiresAt: string;
}

export interface GithubPullRequest {
  repositoryId: string;
  pullNumber: number;
  title: string;
  state: 'OPEN' | 'CLOSED';
  merged: boolean;
  baseBranch: string;
  headSha: string;
  htmlUrl: string;
}

export const getGithubSetup = () => apiClient.get<GithubSetupState>('/github/setup');

export const startGithubInstallationClaim = (returnTo?: string) =>
  apiClient.post<GithubInstallationClaim>(
    '/github/installation-claims',
    returnTo ? { returnTo } : {},
  );

export const listGithubRepositories = () =>
  apiClient.get<GithubRepository[]>('/github/repositories');

export const listGithubPullRequests = (repositoryId: string) =>
  apiClient.get<GithubPullRequest[]>(
    `/github/repositories/${encodeURIComponent(String(repositoryId))}/pulls`,
  );
