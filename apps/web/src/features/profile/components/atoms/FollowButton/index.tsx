'use client';

import { Button } from '@/components/ui/button';
import { PROFILE_MESSAGES } from '@/constants/messages';

import { useToggleFollow } from '../../../hooks/use-toggle-follow';

interface FollowButtonProps {
  userId?: string;
  /** 팔로우 대상 유저 이름 */
  userName: string;
  /** 현재 팔로우 상태 */
  isFollowing: boolean;
  /** 자기 자신이면 true — 이 경우 버튼을 렌더하지 않음 */
  isSelf: boolean;
}

export function FollowButton({ userId = '', userName, isFollowing, isSelf }: FollowButtonProps) {
  const { mutate, isPending } = useToggleFollow(userId, userName);

  if (isSelf) return null;

  const handleClick = () => {
    mutate(!isFollowing);
  };

  return (
    <Button
      variant={isFollowing ? 'outline' : 'solid'}
      size="sm"
      onClick={handleClick}
      loading={isPending}
      loadingLabel={isFollowing ? '언팔로우 중…' : '팔로우 중…'}
      className="font-semibold"
    >
      {isPending
        ? PROFILE_MESSAGES.FOLLOW_LOADING
        : isFollowing
          ? PROFILE_MESSAGES.UNFOLLOW
          : PROFILE_MESSAGES.FOLLOW}
    </Button>
  );
}
