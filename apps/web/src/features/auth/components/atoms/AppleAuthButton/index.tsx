'use client';

import { Apple } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AppleAuthButtonProps {
  variant: 'login' | 'register';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function AppleAuthButton({
  variant,
  className,
  onClick,
  disabled,
  loading,
}: AppleAuthButtonProps) {
  const label = variant === 'login' ? 'Apple로 로그인' : 'Apple로 회원가입';

  return (
    <Button
      type="button"
      className={cn(
        'w-full bg-neutral-950 font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200',
        className,
      )}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      loadingLabel="Apple 연결 중…"
    >
      <Apple aria-hidden="true" className="size-4" />
      {label}
    </Button>
  );
}
