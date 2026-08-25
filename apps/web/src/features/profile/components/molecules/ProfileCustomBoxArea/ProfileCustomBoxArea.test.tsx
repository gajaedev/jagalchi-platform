import { render, screen } from '@testing-library/react';
import { Provider, WritableAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { describe, it, expect } from 'vitest';

import { profileModeAtom } from '../../../stores/profile-atoms';

import { ProfileCustomBoxArea } from './index';

interface WrapperProps {
  initialValues: (readonly [WritableAtom<unknown, any[], any>, unknown])[];
  children: React.ReactNode;
}

const HydrateAtoms = ({ initialValues, children }: WrapperProps) => {
  useHydrateAtoms(initialValues);
  return children;
};

const TestProvider = ({ initialValues, children }: WrapperProps) => (
  <Provider>
    <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
  </Provider>
);

describe('ProfileCustomBoxArea', () => {
  it('renders organization value in show mode', () => {
    render(
      <TestProvider initialValues={[[profileModeAtom, 'show']]}>
        <ProfileCustomBoxArea />
      </TestProvider>,
    );
    expect(screen.getByText('부산소프트웨어마이스터고등학교')).toBeInTheDocument();
  });

  it('renders organization input in edit mode', () => {
    render(
      <TestProvider initialValues={[[profileModeAtom, 'edit']]}>
        <ProfileCustomBoxArea />
      </TestProvider>,
    );
    expect(screen.getByPlaceholderText('소속을 입력해주세요')).toBeInTheDocument();
  });

  it('renders link add button in edit mode', () => {
    render(
      <TestProvider initialValues={[[profileModeAtom, 'edit']]}>
        <ProfileCustomBoxArea />
      </TestProvider>,
    );
    expect(screen.getByRole('button', { name: /링크추가/ })).toBeInTheDocument();
  });

  it('renders initial link in show mode', () => {
    render(
      <TestProvider initialValues={[[profileModeAtom, 'show']]}>
        <ProfileCustomBoxArea />
      </TestProvider>,
    );
    expect(screen.getByText('포트폴리오')).toBeInTheDocument();
  });
});
