'use client';

import { useSyncExternalStore } from 'react';

import { Laptop, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from './button';

const themes = ['light', 'dark', 'system'] as const;
const labels = { light: '라이트 모드', dark: '다크 모드', system: '시스템 설정' } as const;
const changeLabels = {
  light: '라이트 모드로 변경',
  dark: '다크 모드로 변경',
  system: '시스템 설정으로 변경',
} as const;
const subscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return <span aria-hidden="true" className="size-9" />;
  }
  const current = themes.includes(theme as (typeof themes)[number])
    ? (theme as (typeof themes)[number])
    : 'system';
  const next = themes[(themes.indexOf(current) + 1) % themes.length];
  const Icon = current === 'light' ? Sun : current === 'dark' ? Moon : Laptop;

  return (
    <Button
      type="button"
      intent="neutral"
      variant="ghost"
      size="icon-sm"
      aria-label={`${labels[current]} 사용 중. ${changeLabels[next]}`}
      title={`${labels[current]} · 클릭하여 변경`}
      onClick={() => setTheme(next)}
    >
      <Icon aria-hidden="true" />
    </Button>
  );
}
