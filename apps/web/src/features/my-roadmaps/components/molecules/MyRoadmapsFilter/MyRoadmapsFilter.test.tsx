import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { describe, expect, it } from 'vitest';

import { filterCategoryAtom, sortByAtom, sortOrderAtom } from '../../../stores/my-roadmaps.atoms';
import { MyRoadmapsFilter } from './MyRoadmapsFilter';

const HydrateAtoms = ({
  initialValues,
  children,
}: {
  initialValues: [any, any][];
  children: React.ReactNode;
}) => {
  useHydrateAtoms(initialValues);
  return <>{children}</>;
};

const Wrapper = ({
  initialValues,
  children,
}: {
  initialValues: [any, any][];
  children: React.ReactNode;
}) => (
  <Provider>
    <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
  </Provider>
);

const initialValues: [any, any][] = [
  [filterCategoryAtom, 'all'],
  [sortByAtom, 'recent'],
  [sortOrderAtom, 'desc'],
];

function renderFilter() {
  return render(
    <Wrapper initialValues={initialValues}>
      <MyRoadmapsFilter />
    </Wrapper>,
  );
}

describe('MyRoadmapsFilter', () => {
  it('renders all filter sections correctly', () => {
    renderFilter();
    expect(screen.getByText('정렬순서')).toBeInTheDocument();
    expect(screen.getByText('정렬기준')).toBeInTheDocument();
    expect(screen.getByText('필터링')).toBeInTheDocument();
  });

  it('highlights each active semantic state', () => {
    renderFilter();
    expect(screen.getByText('내림차순').closest('button')).toHaveClass('bg-muted');
    expect(screen.getByText('최신순').closest('button')).toHaveClass('bg-muted');
    expect(screen.getByText('전체').closest('button')).toHaveClass('bg-muted');
  });

  it('updates selection state when an item is clicked', () => {
    renderFilter();
    const ascButton = screen.getByText('오름차순').closest('button')!;
    fireEvent.click(ascButton);
    expect(ascButton).toHaveClass('bg-muted');
    expect(screen.getByText('내림차순').closest('button')).not.toHaveClass('bg-muted');
  });
});
