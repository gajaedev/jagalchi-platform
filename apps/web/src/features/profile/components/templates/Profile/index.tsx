'use client';

import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useAtomValue, useSetAtom } from 'jotai';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuthSession } from '@/components/providers/AuthSessionContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AUTH_MESSAGES, PROFILE_MESSAGES } from '@/constants/messages';
import { useDeleteAccount } from '@/hooks/use-delete-account';

import { useProfile } from '../../../hooks/use-profile';
import { useUpdateProfile } from '../../../hooks/use-update-profile';
import {
  profileBioAtom,
  profileImageAtom,
  profileLinksAtom,
  profileModeAtom,
  type ProfileLinkItem,
} from '../../../stores/profile-atoms';
import { ProfileBio } from '../../molecules/ProfileBio';
import { ProfileCustomBoxArea } from '../../molecules/ProfileCustomBoxArea';
import { ProfileHeader } from '../../molecules/ProfileHeader';
import { ProfileStreak } from '../../molecules/ProfileStreak';
import { MadeRoadmapList } from '../../organisms/MadeRoadmapList';
import { ProfileThirdBox } from '../../organisms/ProfileThirdBox';

interface ProfileProps {
  userName?: string;
}

export function Profile({ userName = '' }: ProfileProps) {
  const router = useRouter();
  const mode = useAtomValue(profileModeAtom);
  const setBio = useSetAtom(profileBioAtom);
  const setLinks = useSetAtom(profileLinksAtom);
  const setImage = useSetAtom(profileImageAtom);
  const { beginSessionEnding, clearDeletedSession, restoreSessionAfterEnding } = useAuthSession();
  const bio = useAtomValue(profileBioAtom);
  const links = useAtomValue(profileLinksAtom);
  const image = useAtomValue(profileImageAtom);
  const { mutateAsync: deleteAccount, isPending: isDeleting } = useDeleteAccount();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data, isLoading, isError } = useProfile(userName);
  const { mutateAsync: updateProfile, isPending: isSavingProfile } = useUpdateProfile(userName);
  const isHydrated = useRef(false);

  // 실데이터로 atoms hydration — 최초 1회만 수행하여 edit 모드 중 refetch가 편집 내용을 덮어쓰지 않도록 한다
  useEffect(() => {
    if (!data || isHydrated.current) return;
    isHydrated.current = true;

    const { user } = data;

    if (user.bio !== null && user.bio !== undefined) {
      setBio(user.bio);
    }

    if (user.profileImageUrl) {
      setImage(user.profileImageUrl);
    }

    if (user.externalLinks && Object.keys(user.externalLinks).length > 0) {
      const linkItems: ProfileLinkItem[] = Object.entries(user.externalLinks).map(
        ([name, url]) => ({
          id: name,
          name,
          url,
        }),
      );
      setLinks(linkItems);
    }
  }, [data, setBio, setImage, setLinks]);

  // Warn user before leaving the page while in edit mode
  useEffect(() => {
    if (mode !== 'edit') return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [mode]);

  const handleDeleteAccount = async () => {
    await beginSessionEnding();
    try {
      await deleteAccount();
      await clearDeletedSession();
      router.push('/login');
    } catch {
      await restoreSessionAfterEnding();
      toast.error('계정 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleSaveProfile = async ({ name, email }: { name: string; email: string }) => {
    const externalLinks = Object.fromEntries(links.map((link) => [link.name, link.url]));
    await updateProfile({
      user: {
        name,
        email,
        bio,
        profileImage: image,
        externalLinks,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{PROFILE_MESSAGES.LOADING}</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <p className="text-error">{PROFILE_MESSAGES.ERROR}</p>
      </div>
    );
  }

  const { user, streak } = data;

  return (
    <div className="bg-background text-foreground flex min-h-screen w-full flex-col items-center">
      <header className="border-border bg-card flex h-11 w-full items-center justify-between border-b px-5">
        <Button
          intent="neutral"
          variant="ghost"
          size="xs"
          type="button"
          className="gap-1 text-sm"
          onClick={() => router.back()}
        >
          <ArrowLeft size={14} />
          <span>{PROFILE_MESSAGES.BACK_BUTTON}</span>
        </Button>
        <div className="flex items-center gap-1 text-sm">
          <span>{user.name}</span>
          <Pencil size={16} />
        </div>
      </header>
      <div className="flex w-full max-w-[960px] flex-col gap-10 px-6 py-10">
        <ProfileHeader
          userId={user.id ?? ''}
          userName={user.name}
          email={user.email}
          followerCount={user.stats.followersCount}
          followingCount={user.stats.followingCount}
          isFollowing={user.isFollowed}
          onSave={handleSaveProfile}
          isSaving={isSavingProfile}
        />
        <div className="flex w-full flex-col gap-6 lg:flex-row lg:gap-[76px]">
          <div className="w-full lg:w-[500px] lg:shrink-0">
            <ProfileBio bio={user.bio ?? ''} onChange={setBio} />
          </div>
          <div className="flex-1">
            <ProfileCustomBoxArea />
          </div>
        </div>
        <ProfileStreak activities={streak.activities} currentStreak={streak.currentStreak} />
        <ProfileThirdBox userName={userName} />
        <MadeRoadmapList userName={userName} userId={user.id} />

        {/* 계정 삭제 섹션 */}
        <div className="border-border border-t pt-8">
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button intent="destructive" variant="outline" size="md">
                <Trash2 className="h-4 w-4" />
                {AUTH_MESSAGES.DELETE_ACCOUNT}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{AUTH_MESSAGES.DELETE_ACCOUNT}</AlertDialogTitle>
                <AlertDialogDescription>
                  {AUTH_MESSAGES.DELETE_ACCOUNT_CONFIRM}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  intent="neutral"
                  variant="outline"
                  size="md"
                  disabled={isDeleting}
                >
                  {AUTH_MESSAGES.CANCEL}
                </AlertDialogCancel>
                <AlertDialogAction
                  intent="destructive"
                  variant="solid"
                  size="md"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? AUTH_MESSAGES.DELETING : AUTH_MESSAGES.DELETE_ACCOUNT}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
