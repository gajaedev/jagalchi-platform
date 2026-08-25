'use client';

import type { FollowListResponse } from '@/api/profile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PROFILE_MESSAGES } from '@/constants/messages';

import { useFollowers } from '../../../hooks/use-followers';
import { useFollowings } from '../../../hooks/use-followings';

type FollowDialogType = 'followers' | 'followings';

interface FollowListDialogProps {
  userId?: string;
  /** 조회 대상 유저 이름 */
  userName: string;
  /** 열려 있는 다이얼로그 종류: 'followers' | 'followings' | null */
  open: FollowDialogType | null;
  onOpenChange: (open: boolean) => void;
}

interface FollowUserItemProps {
  profileImage: string | null;
  name: string;
}

function FollowUserItem({ profileImage, name }: FollowUserItemProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Avatar className="size-9">
        {profileImage ? (
          <AvatarImage
            src={profileImage}
            alt={`${name}${PROFILE_MESSAGES.PROFILE_PICTURE_ALT_WITH_NAME}`}
            className="object-cover"
          />
        ) : null}
        <AvatarFallback className="text-muted-foreground text-sm font-semibold">
          {name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium">{name}</span>
    </div>
  );
}

function FollowListContent({
  type,
  userId,
  userName,
}: {
  type: FollowDialogType;
  userId: string;
  userName: string;
}) {
  const followersQuery = useFollowers(userId, userName);
  const followingsQuery = useFollowings(userId, userName);

  const query = type === 'followers' ? followersQuery : followingsQuery;
  const { data, isLoading, isError } = query as {
    data: FollowListResponse | undefined;
    isLoading: boolean;
    isError: boolean;
  };

  if (isLoading) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        {PROFILE_MESSAGES.FOLLOW_LIST_LOADING}
      </p>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-error py-6 text-center text-sm">{PROFILE_MESSAGES.FOLLOW_LIST_ERROR}</p>
    );
  }

  if (data.users.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        {PROFILE_MESSAGES.FOLLOW_LIST_EMPTY}
      </p>
    );
  }

  return (
    <ScrollArea className="max-h-96">
      <div className="divide-border divide-y px-1">
        {data.users.map((user) => (
          <FollowUserItem key={user.id} profileImage={user.profileImage} name={user.name} />
        ))}
      </div>
    </ScrollArea>
  );
}

export function FollowListDialog({
  userId = '',
  userName,
  open,
  onOpenChange,
}: FollowListDialogProps) {
  const title =
    open === 'followers' ? PROFILE_MESSAGES.FOLLOWERS_TITLE : PROFILE_MESSAGES.FOLLOWINGS_TITLE;

  return (
    <Dialog open={open !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {userName}님의 {title} 목록입니다.
          </DialogDescription>
        </DialogHeader>
        {open !== null && <FollowListContent type={open} userId={userId} userName={userName} />}
      </DialogContent>
    </Dialog>
  );
}
