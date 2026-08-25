import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { createTestWrapper } from '@/test-utils/create-test-wrapper';

import { profileModeAtom } from '../../../stores/profile-atoms';

import { ProfileInfoForm } from './index';

describe('ProfileInfoForm', () => {
  const defaultProps = {
    name: 'Test User',
    email: 'test@example.com',
  };

  const createProfileWrapper = (mode: 'show' | 'edit') =>
    createTestWrapper([[profileModeAtom, mode]] as const);

  it('renders correctly in view mode', () => {
    render(<ProfileInfoForm {...defaultProps} />, { wrapper: createProfileWrapper('show') });
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Test User')).not.toBeInTheDocument();
  });

  it('renders inputs in edit mode', () => {
    render(<ProfileInfoForm {...defaultProps} />, { wrapper: createProfileWrapper('edit') });
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  it('updates inputs when typed', () => {
    render(<ProfileInfoForm {...defaultProps} />, { wrapper: createProfileWrapper('edit') });

    const nameInput = screen.getByDisplayValue('Test User');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    expect(nameInput).toHaveValue('New Name');
  });

  it('calls onSave with trimmed profile values', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ProfileInfoForm {...defaultProps} onSave={onSave} />, {
      wrapper: createProfileWrapper('edit'),
    });

    fireEvent.change(screen.getByLabelText('이름'), { target: { value: ' New Name ' } });
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: ' new@example.com ' } });
    fireEvent.click(screen.getByText('저장'));

    await vi.waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({ name: 'New Name', email: 'new@example.com' });
    });
  });
});
