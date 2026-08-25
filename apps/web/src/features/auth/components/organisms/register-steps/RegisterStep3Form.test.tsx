import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { RegisterStep3Form } from './RegisterStep3Form';

describe('RegisterStep3Form', () => {
  it('링크 입력 필드들을 렌더링한다', () => {
    render(<RegisterStep3Form onSubmit={vi.fn()} onSkip={vi.fn()} />);

    const namePlaceholders = screen.getAllByPlaceholderText('링크 이름');
    const urlPlaceholders = screen.getAllByPlaceholderText('링크 URL');

    expect(namePlaceholders).toHaveLength(3);
    expect(urlPlaceholders).toHaveLength(3);
  });

  it('링크 레이블들을 렌더링한다', () => {
    render(<RegisterStep3Form onSubmit={vi.fn()} onSkip={vi.fn()} />);

    expect(screen.getByText('1번 링크')).toBeInTheDocument();
    expect(screen.getByText('2번 링크')).toBeInTheDocument();
    expect(screen.getByText('3번 링크')).toBeInTheDocument();
  });

  it('확인 버튼과 건너뛰기 버튼을 렌더링한다', () => {
    render(<RegisterStep3Form onSubmit={vi.fn()} onSkip={vi.fn()} />);

    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '건너뛰기' })).toBeInTheDocument();
  });

  it('건너뛰기 버튼 클릭 시 onSkip이 호출된다', async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    render(<RegisterStep3Form onSubmit={vi.fn()} onSkip={onSkip} />);

    await user.click(screen.getByRole('button', { name: '건너뛰기' }));

    expect(onSkip).toHaveBeenCalledOnce();
  });

  it('빈 폼 제출 시 onSubmit이 호출된다 (모든 필드가 선택사항)', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RegisterStep3Form onSubmit={onSubmit} onSkip={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
    });
  });

  it('잘못된 URL 입력 시 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup();
    render(<RegisterStep3Form onSubmit={vi.fn()} onSkip={vi.fn()} />);

    const urlInputs = screen.getAllByPlaceholderText('링크 URL');
    await user.type(urlInputs[0], 'not-a-valid-url');
    await user.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => {
      expect(screen.getByText('올바른 URL 형식이 아닙니다')).toBeInTheDocument();
    });
  });

  it('유효한 URL로 제출하면 onSubmit이 호출된다', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RegisterStep3Form onSubmit={onSubmit} onSkip={vi.fn()} />);

    const nameInputs = screen.getAllByPlaceholderText('링크 이름');
    const urlInputs = screen.getAllByPlaceholderText('링크 URL');

    await user.type(nameInputs[0], 'GitHub');
    await user.type(urlInputs[0], 'https://github.com/user');
    await user.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
    });
  });
});
