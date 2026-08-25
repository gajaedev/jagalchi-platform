'use client';

import { Lock, Unlock } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface PanelHeaderProps {
  title: string;
  subtitle: string;
  isLocked: boolean;
  onToggleLock: () => void;
}

/**
 * PropertiesPanel용 공통 헤더 컴포넌트
 *
 * - 제목 + 부제목 표시
 * - Lock/Unlock 토글 버튼
 */
export function PanelHeader({ title, subtitle, isLocked, onToggleLock }: PanelHeaderProps) {
  return (
    <div
      className="border-border flex items-center justify-between gap-4 border-b p-4"
      data-testid="properties-panel-header"
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-foreground text-base font-semibold">{title}</h3>
        <p className="text-muted-foreground text-xs">{subtitle}</p>
      </div>
      <Button
        type="button"
        intent="neutral"
        variant="ghost"
        size="icon-sm"
        onClick={onToggleLock}
        aria-label={isLocked ? '잠금 해제' : '잠금'}
      >
        {isLocked ? (
          <Lock className="h-[13px] w-[13px]" />
        ) : (
          <Unlock className="h-[13px] w-[13px]" />
        )}
      </Button>
    </div>
  );
}
