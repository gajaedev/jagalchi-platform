import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { ProfileStreak } from './index';

describe('ProfileStreak', () => {
  it('renders the streak card', () => {
    const { container } = render(<ProfileStreak />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('displays streak text with 일 연속 스트릭', () => {
    render(<ProfileStreak />);
    expect(screen.getByText(/일 연속 스트릭/)).toBeInTheDocument();
  });

  it('renders contribution cells', () => {
    const { container } = render(<ProfileStreak />);
    // The contribution graph renders many divs for each day
    const cells = container.querySelectorAll('div[title]');
    expect(cells.length).toBeGreaterThan(0);
  });
});
