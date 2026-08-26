import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { RoadmapList } from './index';

describe('RoadmapList', () => {
  it('renders correctly for "end" variant', () => {
    render(<RoadmapList variant="end" />);
    expect(screen.getByText('완료한 실행 과제')).toBeInTheDocument();
  });

  it('renders correctly for "process" variant', () => {
    render(<RoadmapList variant="process" />);
    expect(screen.getByText('진행 중인 실행 과제')).toBeInTheDocument();
  });
});
