import { useRouter } from 'next/navigation';

import { AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EDITOR_MESSAGES } from '@/constants/messages';

interface ErrorFallbackProps {
  error: string;
  onRetry?: () => void;
}

export function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  const router = useRouter();

  return (
    <div className="bg-background flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertCircle className="text-error size-16" />
        <h1 className="text-foreground text-2xl font-bold">{EDITOR_MESSAGES.ERROR_CANNOT_LOAD}</h1>
        <p className="text-muted-foreground max-w-md text-sm">{error}</p>
        <div className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              {EDITOR_MESSAGES.ERROR_RETRY}
            </Button>
          )}
          <Button onClick={() => router.push('/myroadmap')}>
            {EDITOR_MESSAGES.ERROR_BACK_TO_ROADMAPS}
          </Button>
        </div>
      </div>
    </div>
  );
}
