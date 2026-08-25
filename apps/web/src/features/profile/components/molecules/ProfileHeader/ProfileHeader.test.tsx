import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { createTestWrapper } from '@/test-utils/create-test-wrapper';

import { profileImageAtom, profileModeAtom } from '../../../stores/profile-atoms';

import { ProfileHeader } from './index';

describe('ProfileHeader', () => {
  const defaultProps = {
    userName: 'Jane Doe',
    email: 'jane@example.com',
    followerCount: 42,
    followingCount: 10,
  };

  const createProfileWrapper = (mode: 'show' | 'edit') =>
    createTestWrapper([
      [profileModeAtom, mode],
      [profileImageAtom, '/profile.svg'],
    ] as const);

  it('renders user name and email in show mode', () => {
    render(<ProfileHeader {...defaultProps} />, { wrapper: createProfileWrapper('show') });
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('renders follower and following counts', () => {
    render(<ProfileHeader {...defaultProps} />, { wrapper: createProfileWrapper('show') });
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('defaults follower and following counts to 0 when not provided', () => {
    render(<ProfileHeader userName="Test" email="test@example.com" />, {
      wrapper: createProfileWrapper('show'),
    });
    expect(screen.getAllByText('0')).toHaveLength(2);
  });

  it('renders avatar fallback initial when image cannot load', () => {
    render(<ProfileHeader {...defaultProps} />, { wrapper: createProfileWrapper('show') });
    // jsdom does not load images so the AvatarFallback initial is shown
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('shows file input for image upload in edit mode', () => {
    const { container } = render(<ProfileHeader {...defaultProps} />, {
      wrapper: createProfileWrapper('edit'),
    });
    // In edit mode ProfilePicture renders a hidden file input for upload
    expect(container.querySelector('input[type="file"]')).toBeInTheDocument();
  });
});
