import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

import { apiClient } from './client';
import {
  getGithubSetup,
  listGithubPullRequests,
  listGithubRepositories,
  startGithubInstallationClaim,
} from './github';

describe('GitHub App API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads the personal read-only App setup and repository membership', () => {
    getGithubSetup();
    listGithubRepositories();

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/github/setup');
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/github/repositories');
  });

  it('starts a claim with an empty body when there is no return path', () => {
    startGithubInstallationClaim();
    expect(apiClient.post).toHaveBeenCalledWith('/github/installation-claims', {});
  });

  it('serializes only the safe relative return path in the claim body', () => {
    startGithubInstallationClaim('/career?proof=mission-1');
    expect(apiClient.post).toHaveBeenCalledWith('/github/installation-claims', {
      returnTo: '/career?proof=mission-1',
    });
  });

  it('preserves a repository ID larger than Number.MAX_SAFE_INTEGER as a decimal string', () => {
    listGithubPullRequests('90071992547409931234567890');
    expect(apiClient.get).toHaveBeenCalledWith(
      '/github/repositories/90071992547409931234567890/pulls',
    );
  });

  it('URL-encodes repository path input without coercing it to a number', () => {
    listGithubPullRequests('12345/other repository');
    expect(apiClient.get).toHaveBeenCalledWith(
      '/github/repositories/12345%2Fother%20repository/pulls',
    );
  });
});
