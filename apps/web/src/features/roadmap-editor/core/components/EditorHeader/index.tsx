'use client';

import { memo } from 'react';

import { useRouter } from 'next/navigation';

import { useAtomValue } from 'jotai';
import { ChevronLeft, Ellipsis, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { REALTIME_MESSAGES } from '@/constants/messages';

import { roadmapTitleAtom } from '../../../stores/editor-atoms';

interface EditorHeaderProps {
  onBack?: () => void;
  isConnected?: boolean;
  roadmapId?: string;
}

export const EditorHeader = memo(function EditorHeader({
  onBack,
  isConnected,
  roadmapId,
}: EditorHeaderProps) {
  const router = useRouter();
  const title = useAtomValue(roadmapTitleAtom);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/myroadmap');
    }
  };

  return (
    <header className="border-border bg-card text-foreground absolute top-4 left-4 z-10 flex w-fit flex-col gap-4 rounded-lg border p-2 shadow-md">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          intent="neutral"
          variant="ghost"
          size="xs"
          className="min-h-8 min-w-8 rounded-lg p-[7px]"
          onClick={handleBackClick}
          aria-label="뒤로가기"
        >
          <ChevronLeft className="h-[15px] w-[15px]" />
        </Button>

        <span className="text-foreground text-base leading-6 font-semibold whitespace-nowrap">
          {title || 'Jagalchi Roadmap'}
        </span>

        <span className="text-muted-foreground text-xs leading-4 font-medium tracking-[0.18px]">
          (수정중)
        </span>

        {isConnected !== undefined && (
          <span
            className="flex items-center gap-1 text-xs leading-4 font-medium"
            aria-label={
              isConnected
                ? REALTIME_MESSAGES.CONNECTION_CONNECTED
                : REALTIME_MESSAGES.CONNECTION_DISCONNECTED
            }
          >
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isConnected ? 'bg-success' : 'bg-muted-foreground'
              }`}
            />
            <span className={isConnected ? 'text-success' : 'text-muted-foreground'}>
              {isConnected
                ? REALTIME_MESSAGES.CONNECTION_CONNECTED
                : REALTIME_MESSAGES.CONNECTION_DISCONNECTED}
            </span>
          </span>
        )}

        {roadmapId ? (
          <Button
            type="button"
            intent="neutral"
            variant="ghost"
            size="xs"
            className="flex min-h-8 min-w-8 items-center justify-center rounded-lg p-[7px]"
            onClick={() => router.push(`/viewer/${roadmapId}`)}
            aria-label="뷰어 미리보기"
          >
            <Eye className="h-[15px] w-[15px]" />
          </Button>
        ) : null}

        <Button
          type="button"
          intent="neutral"
          variant="ghost"
          size="xs"
          className="flex min-h-8 min-w-8 items-center justify-center rounded-lg p-[7px]"
          aria-label="더보기"
        >
          <Ellipsis className="h-[15px] w-[15px]" />
        </Button>
      </div>

      <Button
        intent="primary"
        variant="solid"
        size="xs"
        className="h-8 w-full rounded-lg px-3 py-[5.5px] text-sm font-semibold"
      >
        Readme 수정
      </Button>
    </header>
  );
});
