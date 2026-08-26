import type { PropsWithChildren } from 'react';

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProofReviewQueueItem } from '@/api/career';

import { CareerReviewQueue } from './CareerReviewQueue';

const reviewProofMission = vi.fn();
const reviewCareerEvidence = vi.fn();

const proofMissionNetwork = {
  id: 'mission-1',
  targetId: 'target-1',
  competencySlug: 'react',
  competencyLabel: 'React',
  title: '결제 화면 상태 복구 미션',
  summary: '사용자가 결제를 다시 시도할 수 있도록 오류 상태를 복구합니다.',
  state: 'REVIEW_PENDING',
  criteria: [
    {
      position: 0,
      type: 'MERGED_PR',
      config: {},
    },
    {
      position: 1,
      type: 'NAMED_CHECK',
      config: {},
    },
    {
      position: 2,
      type: 'HUMAN_CHECK',
      config: { label: '결제 실패 뒤 재시도 흐름을 직접 확인' },
    },
  ],
  currentVerificationRun: {
    status: 'PASS',
    observedAt: '2026-08-25T01:30:00.000Z',
    results: [
      {
        position: 0,
        type: 'MERGED_PR',
        passed: true,
        detail: null,
      },
      {
        position: 1,
        type: 'NAMED_CHECK',
        passed: true,
        detail: null,
      },
      {
        position: 2,
        type: 'HUMAN_CHECK',
        passed: false,
        detail: null,
      },
    ],
  },
  ownerDisplayName: '김리뷰',
  submittedAt: '2026-08-25T01:31:00.000Z',
} satisfies ProofReviewQueueItem;

const proofMission = JSON.parse(JSON.stringify(proofMissionNetwork)) as ProofReviewQueueItem;

function proofQuery(
  data: ProofReviewQueueItem[] | undefined,
  state: { isLoading?: boolean; isError?: boolean } = {},
) {
  return {
    data,
    isLoading: state.isLoading ?? false,
    isError: state.isError ?? false,
    error: state.isError ? new Error('queue failed') : null,
    refetch: vi.fn(),
  };
}

function mutationResult(mutateAsync: ReturnType<typeof vi.fn>) {
  return {
    mutateAsync,
    isPending: false,
    isError: false,
    error: null,
  };
}

let currentProofQuery = proofQuery([proofMission]);

vi.mock('@/components/app-shell/app-shell', () => ({
  AppShell: ({ children }: PropsWithChildren) => <main>{children}</main>,
}));

vi.mock('./use-career', () => ({
  useCareerReviews: () => proofQuery([]),
  useProofReviews: () => currentProofQuery,
  useReviewCareerEvidence: () => mutationResult(reviewCareerEvidence),
  useReviewProofMission: () => mutationResult(reviewProofMission),
}));

describe('CareerReviewQueue proof mission review', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentProofQuery = proofQuery([proofMission]);
    reviewProofMission.mockResolvedValue({ ...proofMission, state: 'APPROVED' });
  });

  it('shows reviewer-safe target and immutable run facts, then approves through the hook', async () => {
    const user = userEvent.setup();
    const serializedMission = JSON.stringify(proofMission);
    for (const forbiddenKey of [
      'binding',
      'bindingVersion',
      'criteriaVersion',
      'criterionId',
      'currentReview',
      'digest',
      'githubRepositoryId',
      'headSha',
      'installationId',
      'provider',
      'providerDetails',
      'providerRawDetails',
      'pullNumber',
      'pullTitle',
      'pullUrl',
      'repositoryName',
      'repositoryPrivate',
      'reviewId',
      'runId',
      'url',
      'verificationRunId',
    ]) {
      expect(serializedMission).not.toContain(`"${forbiddenKey}"`);
    }
    expect(serializedMission).toContain('"label":"결제 실패 뒤 재시도 흐름을 직접 확인"');

    render(<CareerReviewQueue />);

    const mission = screen.getByRole('article', { name: '결제 화면 상태 복구 미션' });
    expect(within(mission).getByText(/김리뷰/)).toBeInTheDocument();
    expect(within(mission).getByText('목표 역량 · React')).toBeInTheDocument();
    expect(
      within(mission).getByRole('region', { name: '제출 당시 고정된 검증 실행' }),
    ).toHaveTextContent('통과');
    expect(within(mission).getByRole('list', { name: '기준별 검증 결과' })).toHaveTextContent(
      'PR 병합 완료',
    );
    expect(within(mission).getByRole('list', { name: '기준별 검증 결과' })).toHaveTextContent(
      '필수 검사 통과',
    );
    expect(within(mission).getByRole('list', { name: '기준별 검증 결과' })).toHaveTextContent(
      '결제 실패 뒤 재시도 흐름을 직접 확인',
    );
    expect(within(mission).getByRole('list', { name: '기준별 검증 결과' })).toHaveTextContent(
      '사람 확인 필요',
    );
    expect(within(mission).getByRole('list', { name: '기준별 검증 결과' })).not.toHaveTextContent(
      '불통과',
    );
    expect(mission).toHaveTextContent(
      '승인은 위에 표시된 모든 사람 확인 항목을 직접 확인했음을 뜻합니다.',
    );

    expect(mission).not.toHaveTextContent('target-1');

    await user.click(within(mission).getByRole('button', { name: '사람 확인 항목 포함 승인' }));

    expect(reviewProofMission).toHaveBeenCalledWith({
      missionId: 'mission-1',
      decision: 'APPROVED',
      note: undefined,
    });
  });

  it('requires an actionable return note before submitting it', async () => {
    const user = userEvent.setup();
    render(<CareerReviewQueue />);

    const mission = screen.getByRole('article', { name: '결제 화면 상태 복구 미션' });
    const returnButton = within(mission).getByRole('button', { name: '보완 요청' });
    await user.click(returnButton);

    expect(reviewProofMission).not.toHaveBeenCalled();
    expect(within(mission).getByRole('alert')).toHaveTextContent('다음 행동을 알 수 있는 메모');
    expect(within(mission).getByRole('textbox', { name: /검토 메모/ })).toHaveAttribute(
      'aria-invalid',
      'true',
    );

    await user.type(
      within(mission).getByRole('textbox', { name: /검토 메모/ }),
      '실패 경로를 재현하는 테스트를 추가해주세요.',
    );
    await user.click(returnButton);

    expect(reviewProofMission).toHaveBeenCalledWith({
      missionId: 'mission-1',
      decision: 'RETURNED',
      note: '실패 경로를 재현하는 테스트를 추가해주세요.',
    });
  });

  it('keeps machine failures distinct from pending human confirmation', () => {
    currentProofQuery = proofQuery([
      {
        ...proofMission,
        currentVerificationRun: {
          ...proofMission.currentVerificationRun!,
          status: 'FAIL',
          results: proofMission.currentVerificationRun!.results.map((criterion) =>
            criterion.position === 1 && criterion.type === 'NAMED_CHECK'
              ? { ...criterion, passed: false }
              : criterion,
          ),
        },
      },
    ]);

    render(<CareerReviewQueue />);

    const mission = screen.getByRole('article', { name: '결제 화면 상태 복구 미션' });
    const criteria = within(mission).getByRole('list', { name: '기준별 검증 결과' });
    expect(within(criteria).getByText('1. PR 병합 완료').parentElement).toHaveTextContent('통과');
    expect(within(criteria).getByText('2. 필수 검사 통과').parentElement).toHaveTextContent(
      '불통과',
    );
    expect(
      within(criteria).getByText('3. 결제 실패 뒤 재시도 흐름을 직접 확인').parentElement,
    ).toHaveTextContent('사람 확인 필요');
    expect(
      within(mission).getByRole('button', { name: '사람 확인 항목 포함 승인' }),
    ).toBeDisabled();
  });

  it.each([
    {
      name: 'loading',
      query: proofQuery(undefined, { isLoading: true }),
      text: '증명 미션 대기열을 불러오는 중입니다.',
      role: 'status' as const,
    },
    {
      name: 'error',
      query: proofQuery(undefined, { isError: true }),
      text: '증명 미션 대기열을 불러오지 못했습니다.',
      role: 'alert' as const,
    },
    {
      name: 'empty',
      query: proofQuery([]),
      text: '대기 중인 증명 미션이 없습니다.',
      role: null,
    },
  ])(
    'renders the proof queue $name state separately from legacy evidence',
    ({ query, text, role }) => {
      currentProofQuery = query;
      render(<CareerReviewQueue />);

      if (role) expect(screen.getByRole(role)).toHaveTextContent(text);
      else expect(screen.getByText(text)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: '기존 결과물 검토' })).toBeInTheDocument();
    },
  );
});
