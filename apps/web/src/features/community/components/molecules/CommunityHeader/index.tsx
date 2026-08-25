'use client';

import { useRouter } from 'next/navigation';

import { ArrowLeft } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { COMMUNITY_MESSAGES } from '@/constants/messages';
import { cn } from '@/lib/utils';

export function CommunityHeader({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <header
      className={cn(
        'border-border bg-background flex h-11 w-full items-center justify-between border-b px-5',
        className,
      )}
    >
      <Button
        type="button"
        intent="neutral"
        variant="ghost"
        size="icon-sm"
        onClick={() => router.back()}
        aria-label={COMMUNITY_MESSAGES.BACK_ARIA}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-foreground text-sm font-normal">UserName</span>
        <Avatar className="h-8 w-8">
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
