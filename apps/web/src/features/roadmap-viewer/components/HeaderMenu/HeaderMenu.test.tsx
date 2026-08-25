import React from 'react';

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@xyflow/react', () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReactFlow: () => ({ fitView: vi.fn(), zoomIn: vi.fn(), zoomOut: vi.fn(), getZoom: () => 1 }),
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  ReactFlow: () => <div data-testid="react-flow" />,
  Background: () => null,
  Controls: () => null,
  MiniMap: () => null,
}));

import { VIEWER_MESSAGES } from '@/constants/messages';
import { HeaderMenu } from './index';

describe('HeaderMenu', () => {
  it('renders the menu trigger button', () => {
    render(<HeaderMenu />);
    const button = document.querySelector('button');
    expect(button).toBeTruthy();
  });

  it('shows top-level menu items after clicking the trigger', async () => {
    render(<HeaderMenu />);
    const trigger = document.querySelector('button')!;
    await userEvent.click(trigger);
    expect(screen.getByText(VIEWER_MESSAGES.MENU_STATISTICS)).toBeTruthy();
    expect(screen.getByText(VIEWER_MESSAGES.MENU_EXPORT)).toBeTruthy();
    expect(screen.getByText(VIEWER_MESSAGES.MENU_IMPORT_JSON)).toBeTruthy();
    expect(screen.getByText(VIEWER_MESSAGES.MENU_DARK_MODE)).toBeTruthy();
    expect(screen.getByText(VIEWER_MESSAGES.MENU_VERSION)).toBeTruthy();
  });
});
