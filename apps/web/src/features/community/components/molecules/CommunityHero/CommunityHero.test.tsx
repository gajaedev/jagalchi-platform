import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { describe, it, expect, vi } from 'vitest';

import { searchQueryAtom } from '../../../stores/community.atoms';
import { CommunityHero } from './index';

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    priority: _priority,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => (
    <img {...props} />
  ),
}));

const HydrateAtoms = ({
  initialValues,
  children,
}: {
  initialValues: any;
  children: React.ReactNode;
}) => {
  useHydrateAtoms(initialValues);
  return children;
};

const Wrapper = ({
  initialValues,
  children,
}: {
  initialValues: any;
  children: React.ReactNode;
}) => (
  <Provider>
    <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
  </Provider>
);

describe('CommunityHero', () => {
  it('renders the title correctly', () => {
    render(
      <Wrapper initialValues={[[searchQueryAtom, '']]}>
        <CommunityHero />
      </Wrapper>,
    );
    expect(screen.getByText('어떤 결과물 과제를 찾고 있나요?')).toBeInTheDocument();
  });

  it('updates input value on change', () => {
    render(
      <Wrapper initialValues={[[searchQueryAtom, '']]}>
        <CommunityHero />
      </Wrapper>,
    );
    const input = screen.getByPlaceholderText('예: 로그인 E2E 테스트 과제') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'React' } });
    expect(input.value).toBe('React');
  });

  it('triggers search on Enter key', () => {
    render(
      <Wrapper initialValues={[[searchQueryAtom, '']]}>
        <CommunityHero />
      </Wrapper>,
    );
    const input = screen.getByPlaceholderText('예: 로그인 E2E 테스트 과제');
    fireEvent.change(input, { target: { value: 'React' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
  });

  it('triggers search on button click', () => {
    render(
      <Wrapper initialValues={[[searchQueryAtom, '']]}>
        <CommunityHero />
      </Wrapper>,
    );
    const input = screen.getByPlaceholderText('예: 로그인 E2E 테스트 과제');
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'Vue' } });
    fireEvent.click(button);
  });
});
import type { ImgHTMLAttributes } from 'react';
