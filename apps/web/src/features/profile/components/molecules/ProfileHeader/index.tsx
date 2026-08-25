'use client';

import { useAtom } from 'jotai';

import { uploadProfileImage } from '@/api/uploads';

import { profileImageAtom } from '../../../stores/profile-atoms';
import { ProfilePicture } from '../../atoms/ProfilePicture';
import { ProfileInfoForm } from '../ProfileInfoForm';

interface ProfileHeaderProps {
  userId?: string;
  userName: string;
  email: string;
  followerCount?: number;
  followingCount?: number;
  isSelf?: boolean;
  isFollowing?: boolean;
  onSave?: (data: { name: string; email: string }) => Promise<void> | void;
  isSaving?: boolean;
}

export function ProfileHeader({
  userName,
  userId = '',
  email,
  followerCount = 0,
  followingCount = 0,
  isSelf = true,
  isFollowing = false,
  onSave,
  isSaving = false,
}: ProfileHeaderProps) {
  const [imageSrc, setImageSrc] = useAtom(profileImageAtom);

  const handleImageUpload = async (file: File) => {
    try {
      setImageSrc(await uploadProfileImage(file));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '프로필 이미지 업로드에 실패했습니다.');
    }
  };

  return (
    <div className="text-foreground flex w-full flex-col items-center gap-6 sm:flex-row sm:gap-6">
      <ProfilePicture src={imageSrc} userName={userName} onUpload={handleImageUpload} />

      <div className="w-full">
        <ProfileInfoForm
          name={userName}
          userId={userId}
          email={email}
          followerCount={followerCount}
          followingCount={followingCount}
          isSelf={isSelf}
          isFollowing={isFollowing}
          onSave={onSave}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
