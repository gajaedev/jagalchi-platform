import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from './client';
import { getProfile, updateProfile, toggleFollow, getFollowers, getFollowings } from './profile';

describe('profile API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getProfile calls GET /users?name=testuser', () => {
    getProfile('testuser');
    expect(apiClient.get).toHaveBeenCalledWith('/users?name=testuser');
  });

  it('getProfile encodes special characters in name', () => {
    getProfile('user name');
    expect(apiClient.get).toHaveBeenCalledWith(`/users?name=${encodeURIComponent('user name')}`);
  });

  it('updateProfile calls PATCH /users/profile with body', () => {
    updateProfile({ user: { bio: 'hello' } });
    expect(apiClient.patch).toHaveBeenCalledWith('/users/profile', {
      bio: 'hello',
    });
  });

  it('toggleFollow uses the authenticated follow resource', () => {
    toggleFollow('user-id', { toggle: true });
    expect(apiClient.put).toHaveBeenCalledWith('/users/user-id/follow');

    toggleFollow('user-id', { toggle: false });
    expect(apiClient.delete).toHaveBeenCalledWith('/users/user-id/follow');
  });

  it('getFollowers calls GET /users/{name}/followers', () => {
    getFollowers('username');
    expect(apiClient.get).toHaveBeenCalledWith('/users/username/followers');
  });

  it('getFollowings calls GET /users/{id}/following', () => {
    getFollowings('username');
    expect(apiClient.get).toHaveBeenCalledWith('/users/username/following');
  });
});
