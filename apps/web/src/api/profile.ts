import { apiClient } from './client';

// === Request Types (aligned with docs/api.md) ===

interface UpdateProfileRequest {
  user: {
    name?: string;
    email?: string;
    profileImage?: string;
    bio?: string;
    externalLinks?: Record<string, string>;
  };
}

interface FollowToggleRequest {
  toggle: boolean;
}

// === Response Types ===

interface UserStats {
  followersCount: number;
  followingCount: number;
}

interface QueryUserDto {
  id?: string;
  name: string;
  email: string;
  profileImageUrl: string | null;
  bio: string | null;
  isFollowed: boolean;
  stats: UserStats;
  externalLinks: Record<string, string>;
}

interface StreakActivity {
  date: string;
  count: number;
}

interface StreakResponseDto {
  currentStreak: number;
  activities: StreakActivity[];
}

interface QueryUserResponse {
  user: QueryUserDto;
  streak: StreakResponseDto;
}

interface MessageResponse {
  message: string;
}

interface FollowUserResponse {
  id: string;
  name: string;
  profileImage: string | null;
  isFollowing: boolean;
}

interface FollowListResponse {
  userId: string;
  type: 'FOLLOWERS' | 'FOLLOWINGS';
  totalCount: number;
  users: FollowUserResponse[];
}

// === API Functions ===

/** GET /users?name={name} — 사용자 프로필 조회 */
export const getProfile = (name: string) =>
  apiClient.get<QueryUserResponse>(`/users?name=${encodeURIComponent(name)}`);

/** PATCH /users/profile — 프로필 수정 */
export const updateProfile = (data: UpdateProfileRequest) =>
  apiClient.patch<MessageResponse>('/users/profile', {
    ...(data.user.name !== undefined ? { name: data.user.name } : {}),
    ...(data.user.bio !== undefined ? { bio: data.user.bio } : {}),
    ...(data.user.profileImage !== undefined ? { profileImageUrl: data.user.profileImage } : {}),
    ...(data.user.externalLinks !== undefined ? { externalLinks: data.user.externalLinks } : {}),
  });

/** PATCH /users/{name}/follow — 팔로우 토글 */
export const toggleFollow = async (userId: string, data: FollowToggleRequest): Promise<void> => {
  if (data.toggle) {
    await apiClient.put<{ following: true }>(`/users/${userId}/follow`);
  } else {
    await apiClient.delete<void>(`/users/${userId}/follow`);
  }
};

/** GET /users/{name}/followers — 팔로워 목록 */
export const getFollowers = (userId: string) =>
  apiClient.get<FollowListResponse>(`/users/${userId}/followers`);

/** GET /users/{name}/followings — 팔로잉 목록 */
export const getFollowings = (userId: string) =>
  apiClient.get<FollowListResponse>(`/users/${userId}/following`);

// === Type Exports ===

export type {
  UpdateProfileRequest,
  FollowToggleRequest,
  QueryUserDto,
  QueryUserResponse,
  StreakResponseDto,
  StreakActivity,
  FollowUserResponse,
  FollowListResponse,
};
