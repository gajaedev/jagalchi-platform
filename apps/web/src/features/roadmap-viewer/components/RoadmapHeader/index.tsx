'use client';

import { useRouter } from 'next/navigation';

import { useAtomValue } from 'jotai';
import { ArrowLeft, ChevronDown, GitFork, Search, Sparkles } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VIEWER_MESSAGES } from '@/constants/messages';
import { useForkRoadmap } from '@/hooks/use-fork-roadmap';
import { useForkStatus } from '@/hooks/use-fork-status';
import { isAuthenticatedAtom } from '@/lib/auth-atoms';

interface RoadmapHeaderProps {
  roadmapId?: string;
  roadmapTitle?: string;
  onAiFeedback?: () => void;
}

export function RoadmapHeader({
  roadmapId = '',
  roadmapTitle = VIEWER_MESSAGES.DEFAULT_ROADMAP_TITLE,
  onAiFeedback,
}: RoadmapHeaderProps) {
  const router = useRouter();
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const { data: forkStatus } = useForkStatus(roadmapId);
  const { mutate: forkRoadmap, isPending: isForkPending } = useForkRoadmap();

  const handleFork = () => {
    if (!roadmapId || !isAuthenticated || forkStatus?.forkedByCurrentUser) return;
    forkRoadmap(roadmapId, {
      onSuccess: (data) => {
        router.push(`/editor/${data.id}`);
      },
    });
  };

  return (
    <header className="border-border bg-background flex h-12 w-full items-center justify-between border-b px-5">
      {/* Left: Back + Title dropdown */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          intent="neutral"
          variant="ghost"
          size="icon-sm"
          onClick={() => router.back()}
          aria-label="뒤로가기"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button type="button" intent="neutral" variant="ghost" size="sm" className="gap-1 px-2">
          {roadmapTitle}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>

      {/* Center: Avatar */}
      <Avatar className="h-8 w-8">
        <AvatarImage src="" alt="User" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>

      {/* Right: Search + Fork + AI button */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder={VIEWER_MESSAGES.SEARCH_PLACEHOLDER}
            className="h-9 w-[200px] rounded-lg pl-9 text-sm"
          />
        </div>
        <Button
          onClick={handleFork}
          disabled={!isAuthenticated || isForkPending || forkStatus?.forkedByCurrentUser}
          variant="outline"
          className="h-9 rounded-lg px-4 text-sm font-semibold"
          title={
            forkStatus?.forkedByCurrentUser
              ? VIEWER_MESSAGES.FORK_ALREADY_FORKED
              : VIEWER_MESSAGES.FORK_BUTTON
          }
        >
          <GitFork className="mr-1.5 h-4 w-4" />
          {forkStatus?.forkedByCurrentUser
            ? VIEWER_MESSAGES.FORK_ALREADY_FORKED
            : VIEWER_MESSAGES.FORK_BUTTON}
        </Button>
        <Button onClick={onAiFeedback} className="h-9 rounded-lg px-4 text-sm font-semibold">
          <Sparkles className="mr-1.5 h-4 w-4" />
          {VIEWER_MESSAGES.AI_FEEDBACK_BUTTON}
        </Button>
      </div>
    </header>
  );
}
