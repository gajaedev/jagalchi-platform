import type { ComponentProps } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { VerificationResults, type VerificationRunView } from './VerificationResults';

const passRun: VerificationRunView = {
  id: 'run-1',
  status: 'PASS',
  observedAt: '2026-08-25T06:30:00.000Z',
  isStale: false,
  results: [
    {
      criterionId: 'criterion-1',
      label: 'PR 병합 완료',
      type: 'MERGED_PR',
      status: 'PASS',
      message: '병합 사실을 확인했습니다.',
    },
    {
      criterionId: 'criterion-2',
      label: '필수 검사 통과',
      type: 'NAMED_CHECK',
      status: 'PASS',
    },
  ],
};

function renderResults(
  run: VerificationRunView | null = passRun,
  overrides: Partial<ComponentProps<typeof VerificationResults>> = {},
) {
  const onRefresh = vi.fn();
  render(
    <VerificationResults
      run={run}
      missionState="BOUND"
      onRefresh={onRefresh}
      isRefreshing={false}
      {...overrides}
    />,
  );
  return onRefresh;
}

describe('VerificationResults', () => {
  it('renders immutable PASS criteria and supports keyboard refresh', async () => {
    const user = userEvent.setup();
    const onRefresh = renderResults();

    expect(screen.getByRole('region', { name: '기준별 검증 결과' })).toBeInTheDocument();
    expect(screen.getByText('전체 통과')).toBeInTheDocument();
    expect(screen.getAllByText('통과')).toHaveLength(2);
    expect(screen.getByText('병합 사실을 확인했습니다.')).toBeInTheDocument();
    expect(screen.getByText(/관찰 시각/).querySelector('time')).toHaveAttribute(
      'datetime',
      passRun.observedAt,
    );

    const refresh = screen.getByRole('button', { name: '직접 새로고침' });
    refresh.focus();
    await user.keyboard('{Enter}');
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it.each([
    ['FAIL' as const, '불통과', '전체 불통과'],
    ['ERROR' as const, '확인 오류', '전체 확인 오류'],
  ])('renders %s machine and criterion outcomes', (status, criterionLabel, summary) => {
    renderResults({
      ...passRun,
      status,
      results: [{ ...passRun.results[0], status }],
    });

    expect(screen.getByText(summary)).toBeInTheDocument();
    expect(screen.getByText(criterionLabel)).toBeInTheDocument();
  });

  it('marks a stale run unusable without exposing its SHA or private operands', () => {
    renderResults({
      ...passRun,
      id: 'run-private-987',
      isStale: true,
      results: [
        {
          ...passRun.results[0],
          message: undefined,
        },
      ],
    });

    expect(screen.getByText('최신 상태 아님')).toBeInTheDocument();
    expect(
      screen.getByText(/이 결과와 이전 승인은 현재 증거로 사용할 수 없습니다/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        /run-private-987|deadbeef|private-org\/private-repo|repository id|head sha/i,
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/채용 점수|합격 가능성|지원자 순위/)).not.toBeInTheDocument();
  });

  it('renders loading, empty, and request error states without ambiguous fallthrough', () => {
    const { rerender } = render(
      <VerificationResults
        run={null}
        missionState="BOUND"
        onRefresh={vi.fn()}
        isRefreshing={false}
        isLoading
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('검증 결과를 불러오는 중입니다.');

    rerender(
      <VerificationResults
        run={null}
        missionState="BOUND"
        onRefresh={vi.fn()}
        isRefreshing={false}
        error="GitHub 연결을 확인하지 못했습니다."
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('GitHub 연결을 확인하지 못했습니다.');
    expect(screen.queryByText('아직 검증 결과가 없습니다.')).not.toBeInTheDocument();

    rerender(
      <VerificationResults
        run={null}
        missionState="BOUND"
        onRefresh={vi.fn()}
        isRefreshing={false}
      />,
    );
    expect(screen.getByText('아직 검증 결과가 없습니다.')).toBeInTheDocument();
  });

  it('locks refresh while loading or archived', () => {
    const { rerender } = render(
      <VerificationResults run={passRun} missionState="BOUND" onRefresh={vi.fn()} isRefreshing />,
    );
    expect(screen.getByRole('button', { name: '직접 새로고침' })).toBeDisabled();

    rerender(
      <VerificationResults
        run={passRun}
        missionState="ARCHIVED"
        onRefresh={vi.fn()}
        isRefreshing={false}
      />,
    );
    expect(screen.getByRole('button', { name: '직접 새로고침' })).toBeDisabled();
  });

  it('handles an immutable run with no criterion rows', () => {
    renderResults({ ...passRun, results: [] });
    expect(screen.getByText('이 실행에 표시할 기준 결과가 없습니다.')).toBeInTheDocument();
  });
});
