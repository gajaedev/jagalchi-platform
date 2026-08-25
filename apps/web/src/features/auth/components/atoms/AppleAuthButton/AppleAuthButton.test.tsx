import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AppleAuthButton } from './index';

describe('AppleAuthButton', () => {
  it('renders the requested OAuth action and stays out of form submission', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<AppleAuthButton variant="login" onClick={onClick} />);

    const button = screen.getByRole('button', { name: 'Apple로 로그인' });
    expect(button).toHaveAttribute('type', 'button');
    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
