import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { RegisterStep2Form } from './RegisterStep2Form';

describe('RegisterStep2Form', () => {
  it('사용자 이름 입력 필드를 렌더링한다', () => {
    render(<RegisterStep2Form onSubmit={vi.fn()} />);

    expect(screen.getByPlaceholderText('사용자 이름 입력')).toBeInTheDocument();
  });

  it('확인 버튼을 렌더링한다', () => {
    render(<RegisterStep2Form onSubmit={vi.fn()} />);

    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
  });

  it('이름 레이블을 렌더링한다', () => {
    render(<RegisterStep2Form onSubmit={vi.fn()} />);

    expect(screen.getByText('이름')).toBeInTheDocument();
  });

  it('사용자 이름 없이 제출하면 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup();
    render(<RegisterStep2Form onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => {
      expect(screen.getByText('이름을 입력해주세요')).toBeInTheDocument();
    });
  });

  it('유효한 이름으로 제출하면 onSubmit이 호출된다', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RegisterStep2Form onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('사용자 이름 입력'), '홍길동');
    await user.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
    });
  });

  it('onSubmit이 올바른 데이터와 함께 호출된다', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RegisterStep2Form onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('사용자 이름 입력'), '홍길동');
    await user.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
      expect(onSubmit.mock.calls[0][0]).toEqual({ username: '홍길동' });
    });
  });
});
