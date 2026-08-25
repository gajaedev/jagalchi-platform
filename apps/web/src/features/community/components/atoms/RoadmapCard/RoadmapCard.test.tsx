import type { ImgHTMLAttributes } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RoadmapCard } from './index';

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    priority: _priority,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => (
    <img {...props} />
  ),
}));

describe('RoadmapCard', () => {
  it('renders the title and author correctly', () => {
    render(
      <RoadmapCard
        id="11111111-1111-4111-8111-111111111111"
        title="Test Roadmap"
        author="John Doe"
      />,
    );

    expect(screen.getByText('Test Roadmap')).toBeInTheDocument();
    expect(screen.getByText('By John Doe')).toBeInTheDocument();
  });

  it('renders the placeholder icon when no imageUrl is provided', () => {
    const { container } = render(
      <RoadmapCard
        id="22222222-2222-4222-8222-222222222222"
        title="Test Roadmap"
        author="John Doe"
      />,
    );

    const svg = container.querySelector('.lucide-square-dashed');
    expect(svg).toBeInTheDocument();
  });

  it('renders the image when imageUrl is provided', () => {
    const imageUrl = 'https://example.com/image.png';
    render(
      <RoadmapCard
        id="33333333-3333-4333-8333-333333333333"
        title="Test Roadmap"
        author="John Doe"
        imageUrl={imageUrl}
      />,
    );

    const image = screen.getByAltText('Test Roadmap');
    expect(image).toBeInTheDocument();

    expect(image).toHaveAttribute('src');
  });
});
