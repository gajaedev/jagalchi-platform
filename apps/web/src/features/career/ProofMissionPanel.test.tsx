import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  ProofMissionPanel,
  type ProofMissionPanelMission,
  type ProofMissionPanelProps,
} from './ProofMissionPanel';

const baseMission: ProofMissionPanelMission = {
  id: 'mission-1',
  objective: 'React 역량 증명',
  state: 'BOUND',
  criteriaCount: 3,
  isGithubBound: true,
  currentRunStatus: 'PASS',
  isStale: false,
};

function renderPanel(
  mission: Partial<ProofMissionPanelMission> = {},
  props: Partial<ProofMissionPanelProps> = {},
) {
  const callbacks = {
    onEditCriteria: vi.fn(),
    onConnectGithub: vi.fn(),
    onBind: vi.fn(),
    onRefresh: vi.fn(),
    onSubmit: vi.fn(),
  };
  render(
    <ProofMissionPanel
      mission={{ ...baseMission, ...mission }}
      competency={{ slug: 'react', label: 'React' }}
      {...callbacks}
      isRefreshing={false}
      isSubmitting={false}
      {...props}
    />,
  );
  return callbacks;
}

describe('ProofMissionPanel', () => {
  it('exposes the mission and Korean-first actions through semantic controls', async () => {
    const user = userEvent.setup();
    const callbacks = renderPanel();

    expect(screen.getByRole('region', { name: 'React 역량 증명' })).toBeInTheDocument();
    expect(screen.getByText('목표 역량:')).toHaveTextContent('React');
    expect(screen.getByText('3개')).toBeInTheDocument();
    expect(screen.getByText('PR 연결됨')).toBeInTheDocument();

    const editButton = screen.getByRole('button', { name: '기준 편집' });
    editButton.focus();
    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('button', { name: 'PR 변경' }));
    await user.click(screen.getByRole('button', { name: '직접 검증' }));
    await user.click(screen.getByRole('button', { name: '검토 요청' }));

    expect(callbacks.onEditCriteria).toHaveBeenCalledOnce();
    expect(callbacks.onBind).toHaveBeenCalledOnce();
    expect(callbacks.onRefresh).toHaveBeenCalledOnce();
    expect(callbacks.onSubmit).toHaveBeenCalledOnce();
  });

  it.each<{
    state: ProofMissionPanelMission['state'];
    canEditCriteria: boolean;
  }>([
    { state: 'DRAFT', canEditCriteria: true },
    { state: 'BOUND', canEditCriteria: true },
    { state: 'RETURNED', canEditCriteria: true },
    { state: 'REVIEW_PENDING', canEditCriteria: false },
    { state: 'APPROVED', canEditCriteria: false },
    { state: 'ARCHIVED', canEditCriteria: false },
  ])('sets criteria editing availability for $state', async ({ state, canEditCriteria }) => {
    const user = userEvent.setup();
    const callbacks = renderPanel({ state });
    const editButton = screen.getByRole('button', { name: '기준 편집' });

    if (canEditCriteria) {
      expect(editButton).toBeEnabled();
      await user.click(editButton);
      expect(callbacks.onEditCriteria).toHaveBeenCalledOnce();
    } else {
      expect(editButton).toBeDisabled();
      await user.click(editButton);
      expect(callbacks.onEditCriteria).not.toHaveBeenCalled();
    }
  });

  it.each<[Partial<ProofMissionPanelMission>, string]>([
    [{ currentRunStatus: null }, '실행 결과 없음'],
    [{ currentRunStatus: 'FAIL' as const }, '실패한 실행'],
    [{ currentRunStatus: 'ERROR' as const }, '오류 실행'],
    [{ currentRunStatus: 'PASS' as const, isStale: true }, '오래된 통과 실행'],
    [{ currentRunStatus: 'PASS' as const, state: 'REVIEW_PENDING' as const }, '이미 검토 중'],
  ])(
    'prevents review submission for $1',
    (mission: Partial<ProofMissionPanelMission>, _label: string) => {
      renderPanel(mission);

      expect(screen.getByRole('button', { name: '검토 요청' })).toBeDisabled();
      if (mission.state === undefined || mission.state !== 'REVIEW_PENDING') {
        expect(
          screen.getByText('통과한 최신 검증 결과가 있어야 검토를 요청할 수 있습니다.'),
        ).toBeInTheDocument();
      }
    },
  );

  it('requires a new refresh when a previous approval is stale', () => {
    renderPanel({ state: 'RETURNED', isStale: true });

    expect(screen.getByText('이전 검증이 더 이상 최신이 아닙니다.')).toBeInTheDocument();
    expect(screen.getByText(/변경된 PR 상태를 직접 새로고침/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '검토 요청' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '직접 검증' })).toBeEnabled();
  });

  it('shows the personal GitHub connection action without accepting hidden provider operands', async () => {
    const user = userEvent.setup();
    const callbacks = renderPanel({ isGithubBound: false, currentRunStatus: null });

    await user.click(screen.getByRole('button', { name: 'GitHub 연결' }));
    expect(callbacks.onConnectGithub).toHaveBeenCalledOnce();
    expect(
      screen.queryByText(/head sha|repository id|installation id|채용 점수|합격 가능성/i),
    ).not.toBeInTheDocument();
  });

  it('locks every command for archived missions and exposes loading states', () => {
    const { rerender } = render(
      <ProofMissionPanel
        mission={{ ...baseMission, state: 'ARCHIVED' }}
        competency={{ slug: 'react', label: 'React' }}
        onEditCriteria={vi.fn()}
        onConnectGithub={vi.fn()}
        onBind={vi.fn()}
        onRefresh={vi.fn()}
        onSubmit={vi.fn()}
        isRefreshing={false}
        isSubmitting={false}
      />,
    );

    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled();

    rerender(
      <ProofMissionPanel
        mission={baseMission}
        competency={{ slug: 'react', label: 'React' }}
        onEditCriteria={vi.fn()}
        onConnectGithub={vi.fn()}
        onBind={vi.fn()}
        onRefresh={vi.fn()}
        onSubmit={vi.fn()}
        isRefreshing
        isSubmitting
      />,
    );
    expect(screen.getByRole('button', { name: '직접 검증' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '검토 요청' })).toBeDisabled();
  });
});
