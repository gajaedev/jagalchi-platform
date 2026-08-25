import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const theme = vi.hoisted(() => ({ current: 'light', setTheme: vi.fn() }));
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: theme.current, setTheme: theme.setTheme }),
}));

import { ThemeToggle } from './theme-toggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    theme.current = 'light';
    theme.setTheme.mockClear();
  });

  it('cycles light to dark with an accessible label', async () => {
    render(<ThemeToggle />);
    const button = await screen.findByRole('button', {
      name: '라이트 모드 사용 중. 다크 모드로 변경',
    });
    fireEvent.click(button);
    expect(theme.setTheme).toHaveBeenCalledWith('dark');
  });

  it('uses the correct Korean particle when cycling dark to system', async () => {
    theme.current = 'dark';
    render(<ThemeToggle />);
    const button = await screen.findByRole('button', {
      name: '다크 모드 사용 중. 시스템 설정으로 변경',
    });
    fireEvent.click(button);
    expect(theme.setTheme).toHaveBeenCalledWith('system');
  });
});
