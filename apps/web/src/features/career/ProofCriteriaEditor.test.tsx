import type { ComponentProps } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ProofCriteriaEditor, type ProofCriterion } from './ProofCriteriaEditor';

const mergedCriterion: ProofCriterion = { id: 'criterion-1', type: 'MERGED_PR' };

function renderEditor(
  criteria: ProofCriterion[] = [mergedCriterion],
  overrides: Partial<ComponentProps<typeof ProofCriteriaEditor>> = {},
) {
  const onSave = vi.fn();
  render(
    <ProofCriteriaEditor
      criteria={criteria}
      disabled={false}
      onSave={onSave}
      isSaving={false}
      {...overrides}
    />,
  );
  return onSave;
}

describe('ProofCriteriaEditor', () => {
  it('saves one finite structured criterion using keyboard-accessible controls', async () => {
    const user = userEvent.setup();
    const onSave = renderEditor();

    expect(screen.getByRole('group', { name: '검증 기준 편집' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1번 기준 삭제' })).toBeDisabled();

    const saveButton = screen.getByRole('button', { name: '기준 저장' });
    saveButton.focus();
    await user.keyboard('{Enter}');

    expect(onSave).toHaveBeenCalledWith([mergedCriterion]);
  });

  it('rejects zero criteria and never invokes persistence', async () => {
    const user = userEvent.setup();
    const onSave = renderEditor([]);

    await user.click(screen.getByRole('button', { name: '기준 저장' }));

    expect(screen.getByRole('alert')).toHaveTextContent('검증 기준은 1개 이상 10개 이하');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('caps criteria at ten and disables the add control', () => {
    renderEditor(
      Array.from({ length: 10 }, (_, index) => ({
        id: `criterion-${index}`,
        type: 'MERGED_PR' as const,
      })),
    );

    expect(screen.getByText('10 / 10개')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '기준 추가' })).toBeDisabled();
  });

  it('validates required typed operands and trims them before save', async () => {
    const user = userEvent.setup();
    const onSave = renderEditor([{ type: 'BASE_BRANCH', branch: '' }]);

    await user.type(screen.getByRole('textbox', { name: '정확한 기준 브랜치' }), '   ');
    await user.click(screen.getByRole('button', { name: '기준 저장' }));
    expect(screen.getByRole('alert')).toHaveTextContent('모든 검증 기준의 내용을 입력해주세요.');
    expect(onSave).not.toHaveBeenCalled();

    await user.clear(screen.getByRole('textbox', { name: '정확한 기준 브랜치' }));
    await user.type(screen.getByRole('textbox', { name: '정확한 기준 브랜치' }), '  main  ');
    await user.click(screen.getByRole('button', { name: '기준 저장' }));
    expect(onSave).toHaveBeenCalledWith([{ type: 'BASE_BRANCH', branch: 'main' }]);
  });

  it('adds a selected allowlisted criterion without arbitrary scripts or regex controls', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.selectOptions(screen.getByLabelText('추가할 기준 유형'), 'HUMAN_CHECK');
    await user.click(screen.getByRole('button', { name: '기준 추가' }));

    expect(screen.getByRole('textbox', { name: '리뷰어 확인 항목' })).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /스크립트|정규식|CI 로그/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('2 / 10개')).toBeInTheDocument();
  });

  it('surfaces save errors and keeps the draft available for correction', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new Error('기준 버전이 변경되었습니다.'));
    renderEditor([mergedCriterion], { onSave });

    await user.click(screen.getByRole('button', { name: '기준 저장' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('기준 버전이 변경되었습니다.');
    expect(screen.getByText('1 / 10개')).toBeInTheDocument();
  });

  it.each([
    [{ disabled: true, isSaving: false }, 'disabled'],
    [{ disabled: false, isSaving: true }, 'saving'],
  ])('locks editor interactions while %s', async (overrides) => {
    renderEditor([mergedCriterion], overrides);

    expect(screen.getByRole('group', { name: '검증 기준 편집' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '기준 추가' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '기준 저장' })).toBeDisabled();
    await waitFor(() => expect(screen.getByText('1 / 10개')).toBeVisible());
  });
});
