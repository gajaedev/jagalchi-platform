import type { PropsWithChildren } from 'react';

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CareerDiff, ProofMission } from '@/api/career';

import { CareerWorkspace } from './CareerWorkspace';

const createMission = vi.fn();
const replaceCriteria = vi.fn();
const bindMission = vi.fn();
const refreshVerification = vi.fn();
const submitMission = vi.fn();
const createTarget = vi.fn();
const createEvidence = vi.fn();
const startGithubClaim = vi.fn();
const updateOwnerProofProfile = vi.fn();
const publishOwnerProof = vi.fn();
const renewOwnerProof = vi.fn();
const unpublishOwnerProof = vi.fn();
const refetchOwnerProofProfile = vi.fn();

let missions: ProofMission[] = [];
let diffStatus: CareerDiff['competencies'][number]['status'] = 'MISSING';
let ownerProofProfileQuery = {
  data: {
    state: 'DISABLED' as const,
    publicId: null,
    displayName: '',
    summary: '',
    proofs: [],
  },
  isLoading: false,
  isError: false,
  error: null as Error | null,
  refetch: refetchOwnerProofProfile,
};

const target = {
  id: 'target-toss-frontend',
  userId: 'owner-1',
  company: '토스',
  role: '프론트엔드 개발자',
  postingUrl: 'https://jobs.example/frontend',
  requirements: 'React 제품 개발',
  competencySlugs: ['react'],
  status: 'ACTIVE' as const,
  createdAt: '2026-08-25T00:00:00.000Z',
  updatedAt: '2026-08-25T00:00:00.000Z',
};

const mission: ProofMission = {
  id: 'mission-react',
  targetId: target.id,
  competencySlug: 'react',
  competencyLabel: 'React',
  title: 'React 역량 증명',
  summary: null,
  state: 'DRAFT',
  criteriaVersion: 1,
  bindingVersion: 0,
  binding: null,
  criteria: [{ id: 'criterion-1', position: 0, type: 'MERGED_PR', config: {} }],
  currentVerificationRun: null,
  currentReview: null,
  createdAt: '2026-08-25T00:00:00.000Z',
  updatedAt: '2026-08-25T00:00:00.000Z',
};

const approvedMission: ProofMission = {
  ...mission,
  state: 'APPROVED',
  binding: {
    installationId: 'installation-owner',
    githubRepositoryId: '9007199254740991',
    pullNumber: 42,
    repositoryName: 'owner-account/private-proof',
    repositoryPrivate: true,
    pullTitle: 'private title sentinel',
    pullUrl: 'https://github.example/private/pull/42',
  },
  currentVerificationRun: {
    id: 'run-approved',
    status: 'PASS',
    headSha: 'deadbeef-private-sha',
    observedAt: '2026-08-25T06:30:00.000Z',
    stale: false,
    criteria: [
      {
        criterionId: 'criterion-1',
        position: 0,
        type: 'MERGED_PR',
        passed: true,
        detail: null,
      },
    ],
  },
  currentReview: {
    id: 'review-approved',
    verificationRunId: 'run-approved',
    decision: 'APPROVED',
    note: null,
    reviewedAt: '2026-08-25T06:35:00.000Z',
  },
};

function enabledOwnerProfile(
  proofs: Array<{
    publicationState: 'ACTIVE' | 'UNPUBLISHED' | 'INVALIDATED';
    validUntil: string;
    isPublished: boolean;
  }> = [],
) {
  return {
    state: 'ENABLED' as const,
    publicId: 'public-profile-1',
    displayName: '김자갈',
    summary: '',
    proofs: proofs.map((proof) => ({
      missionId: approvedMission.id,
      publicProofId: 'public-proof-react',
      title: approvedMission.title,
      summary: approvedMission.summary,
      competencyLabel: approvedMission.competencyLabel,
      verifiedAt: approvedMission.currentReview!.reviewedAt,
      criteria: { passedCount: 1, totalCount: 1, types: ['MERGED_PR' as const] },
      ...proof,
    })),
  };
}

function queryResult<T>(data: T) {
  return {
    data,
    isLoading: false,
    isError: false,
    error: null,
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

vi.mock('@/components/app-shell/app-shell', () => ({
  AppShell: ({ children }: PropsWithChildren) => <main>{children}</main>,
}));

vi.mock('./use-career', () => ({
  useCareerCompetencies: () =>
    queryResult([
      {
        slug: 'react',
        label: 'React',
        category: 'FRONTEND',
        description: '제품 요구사항에 맞는 React 컴포넌트를 설계합니다.',
      },
    ]),
  useCareerTargets: () => queryResult([target]),
  useCareerEvidence: () => queryResult([]),
  useCareerDiff: () => {
    const verified = diffStatus === 'VERIFIED' ? 1 : 0;
    const submitted = diffStatus === 'SUBMITTED' ? 1 : 0;
    return queryResult({
      target,
      summary: {
        requiredCount: 1,
        verifiedCount: verified,
        submittedCount: submitted,
        missingCount: 1 - verified - submitted,
        verifiedPercentage: verified * 100,
      },
      competencies: [
        {
          slug: 'react',
          label: 'React',
          category: 'FRONTEND',
          description: '제품 요구사항에 맞는 React 컴포넌트를 설계합니다.',
          status: diffStatus,
          evidence: [],
        },
      ],
    });
  },
  useProofMissions: () => queryResult(missions),
  useCreateCareerTarget: () => mutationResult(createTarget),
  useCreateCareerEvidence: () => mutationResult(createEvidence),
  useCreateProofMission: () => mutationResult(createMission),
  useReplaceProofCriteria: () => mutationResult(replaceCriteria),
  useBindProofMission: () => mutationResult(bindMission),
  useRefreshProofVerification: () => mutationResult(refreshVerification),
  useSubmitProofMission: () => mutationResult(submitMission),
  useOwnerProofProfile: () => ownerProofProfileQuery,
  useUpdateOwnerProofProfile: () => mutationResult(updateOwnerProofProfile),
  usePublishOwnerProof: () => mutationResult(publishOwnerProof),
  useRenewOwnerProof: () => mutationResult(renewOwnerProof),
  useUnpublishOwnerProof: () => mutationResult(unpublishOwnerProof),
}));

vi.mock('./use-github', () => ({
  getGithubConnectionIssue: () => 'TRANSIENT',
  useGithubSetup: () =>
    queryResult({
      installation: {
        id: 'installation-1',
        status: 'ACTIVE',
        accountId: '90071992547409931234',
      },
    }),
  useGithubRepositories: () =>
    queryResult([
      {
        repositoryId: '9007199254740991',
        fullName: 'owner-account/private-proof',
        private: true,
      },
    ]),
  useStartGithubInstallationClaim: () => mutationResult(startGithubClaim),
}));

describe('CareerWorkspace proof mission vertical', () => {
  beforeEach(() => {
    missions = [];
    diffStatus = 'MISSING';
    ownerProofProfileQuery = {
      data: {
        state: 'DISABLED',
        publicId: null,
        displayName: '',
        summary: '',
        proofs: [],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchOwnerProofProfile,
    };
    vi.clearAllMocks();
    createMission.mockResolvedValue(mission);
    bindMission.mockResolvedValue(mission);
  });

  it('does not render editable profile fields while the owner profile is loading', () => {
    ownerProofProfileQuery = {
      ...ownerProofProfileQuery,
      data: undefined as never,
      isLoading: true,
    };

    render(<CareerWorkspace />);

    expect(screen.getByRole('status')).toHaveTextContent('공개 증명 프로필을 불러오는 중입니다.');
    expect(screen.queryByLabelText('공개 표시 이름')).not.toBeInTheDocument();
  });

  it('keeps profile errors non-actionable except for retry', async () => {
    const user = userEvent.setup();
    ownerProofProfileQuery = {
      ...ownerProofProfileQuery,
      data: undefined as never,
      isError: true,
      error: new Error('profile unavailable'),
    };

    render(<CareerWorkspace />);

    expect(screen.getByText('공개 증명 프로필을 불러오지 못했습니다.')).toBeInTheDocument();
    expect(screen.queryByLabelText('공개 표시 이름')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '프로필 다시 시도' }));
    expect(refetchOwnerProofProfile).toHaveBeenCalledOnce();
    expect(updateOwnerProofProfile).not.toHaveBeenCalled();
  });

  it('does not treat an undefined owner profile response as an empty editable profile', () => {
    ownerProofProfileQuery = {
      ...ownerProofProfileQuery,
      data: undefined as never,
    };

    render(<CareerWorkspace />);

    expect(screen.getByText('공개 증명 프로필 상태를 확인하지 못했습니다.')).toBeInTheDocument();
    expect(screen.queryByLabelText('공개 표시 이름')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '프로필 다시 시도' })).toBeInTheDocument();
  });

  it('renders the empty create form only after a successful null owner profile response', () => {
    ownerProofProfileQuery = {
      ...ownerProofProfileQuery,
      data: null as never,
    };

    render(<CareerWorkspace />);

    expect(screen.getByLabelText('공개 표시 이름')).toHaveValue('');
    expect(screen.getByRole('button', { name: '표시 정보 저장' })).toBeInTheDocument();
  });

  it('creates a mission from the selected target gap with one target-scoped competency', async () => {
    const user = userEvent.setup();
    render(<CareerWorkspace />);

    expect(screen.getByRole('heading', { name: '목표 직무까지 부족한 증거' })).toBeInTheDocument();
    expect(
      screen.getByText('제품 요구사항에 맞는 React 컴포넌트를 설계합니다.'),
    ).toBeInTheDocument();
    expect(screen.getByText('0%', { exact: true })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '증명 미션 시작' }));

    expect(createMission).toHaveBeenCalledWith({
      targetId: target.id,
      competencySlug: 'react',
      title: 'React 역량 증명',
    });
  });

  it('opens an existing mission instead of creating a duplicate', async () => {
    const user = userEvent.setup();
    missions = [mission];
    render(<CareerWorkspace />);

    await user.click(screen.getByRole('button', { name: '증명 미션 열기' }));

    expect(await screen.findByRole('region', { name: 'React 역량 증명' })).toBeInTheDocument();
    expect(createMission).not.toHaveBeenCalled();
    expect(screen.getByText('작성 중')).toBeInTheDocument();
  });

  it('publishes an eligible approved mission that has no publication row', async () => {
    const user = userEvent.setup();
    missions = [approvedMission];
    ownerProofProfileQuery = {
      ...ownerProofProfileQuery,
      data: enabledOwnerProfile() as never,
    };
    publishOwnerProof.mockResolvedValue(undefined);

    render(<CareerWorkspace />);
    await user.click(screen.getByRole('button', { name: '증명 미션 열기' }));
    await user.click(screen.getByRole('button', { name: 'Proof Profile에 공개' }));

    expect(publishOwnerProof).toHaveBeenCalledWith({ missionId: approvedMission.id });
  });

  it('re-publishes a currently eligible invalidated row with a non-elapsed lease', async () => {
    const user = userEvent.setup();
    missions = [approvedMission];
    ownerProofProfileQuery = {
      ...ownerProofProfileQuery,
      data: enabledOwnerProfile([
        {
          publicationState: 'INVALIDATED',
          validUntil: '2099-09-24T02:30:00.000Z',
          isPublished: false,
        },
      ]) as never,
    };
    publishOwnerProof.mockResolvedValue(undefined);

    render(<CareerWorkspace />);
    await user.click(screen.getByRole('button', { name: '증명 미션 열기' }));
    await user.click(screen.getByRole('button', { name: 'Proof Profile에 다시 공개' }));

    expect(publishOwnerProof).toHaveBeenCalledWith({ missionId: approvedMission.id });
  });

  it('prepares an eligible elapsed invalidated row, then exposes explicit publish after refetch', async () => {
    const user = userEvent.setup();
    missions = [approvedMission];
    ownerProofProfileQuery = {
      ...ownerProofProfileQuery,
      data: enabledOwnerProfile([
        {
          publicationState: 'INVALIDATED',
          validUntil: '2020-09-24T02:30:00.000Z',
          isPublished: false,
        },
      ]) as never,
    };
    renewOwnerProof.mockResolvedValue(undefined);

    const view = render(<CareerWorkspace />);
    await user.click(screen.getByRole('button', { name: '증명 미션 열기' }));
    await user.click(screen.getByRole('button', { name: '검증 상태 확인 후 공개 준비' }));

    expect(renewOwnerProof).toHaveBeenCalledWith({ missionId: approvedMission.id });
    ownerProofProfileQuery = {
      ...ownerProofProfileQuery,
      data: enabledOwnerProfile([
        {
          publicationState: 'INVALIDATED',
          validUntil: '2099-09-24T02:30:00.000Z',
          isPublished: false,
        },
      ]) as never,
    };
    view.rerender(<CareerWorkspace />);

    expect(screen.getByRole('button', { name: 'Proof Profile에 다시 공개' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '검증 상태 확인 후 공개 준비' }),
    ).not.toBeInTheDocument();
  });

  it('does not offer invalidated lease recovery when the current mission facts are stale', async () => {
    const user = userEvent.setup();
    missions = [
      {
        ...approvedMission,
        currentVerificationRun: {
          ...approvedMission.currentVerificationRun!,
          stale: true,
        },
      },
    ];
    ownerProofProfileQuery = {
      ...ownerProofProfileQuery,
      data: enabledOwnerProfile([
        {
          publicationState: 'INVALIDATED',
          validUntil: '2020-09-24T02:30:00.000Z',
          isPublished: false,
        },
      ]) as never,
    };

    render(<CareerWorkspace />);
    await user.click(screen.getByRole('button', { name: '증명 미션 열기' }));

    expect(
      screen.queryByRole('button', { name: '검증 상태 확인 후 공개 준비' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Proof Profile에 다시 공개' }),
    ).not.toBeInTheDocument();
    expect(renewOwnerProof).not.toHaveBeenCalled();
  });

  it('directs an elapsed unpublished row to renew in settings without doomed publish', async () => {
    const user = userEvent.setup();
    missions = [approvedMission];
    ownerProofProfileQuery = {
      ...ownerProofProfileQuery,
      data: enabledOwnerProfile([
        {
          publicationState: 'UNPUBLISHED',
          validUntil: '2020-09-24T02:30:00.000Z',
          isPublished: false,
        },
      ]) as never,
    };

    render(<CareerWorkspace />);
    await user.click(screen.getByRole('button', { name: '증명 미션 열기' }));

    expect(
      screen.getByText(/Proof Profile 공개 설정에서 기한을 갱신한 뒤 공개해주세요/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '공개 기한 먼저 갱신' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Proof Profile에 공개' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Proof Profile에 다시 공개' }),
    ).not.toBeInTheDocument();
    expect(publishOwnerProof).not.toHaveBeenCalled();
  });

  it('binds a repository selected from the personal GitHub App installation', async () => {
    const user = userEvent.setup();
    missions = [mission];
    render(<CareerWorkspace />);

    await user.click(screen.getByRole('button', { name: '증명 미션 열기' }));
    await user.click(screen.getByRole('button', { name: 'GitHub 연결' }));

    const picker = screen.getByRole('region', { name: 'GitHub 증거 연결' });
    expect(within(picker).getByRole('status')).toHaveTextContent(
      'GitHub 개인 계정 ID 90071992547409931234 연결됨',
    );
    await user.selectOptions(within(picker).getByLabelText('저장소'), '9007199254740991');
    await user.type(within(picker).getByLabelText('PR 번호'), '42');
    await user.click(within(picker).getByRole('button', { name: '이 PR 연결하기' }));

    expect(bindMission).toHaveBeenCalledWith({
      missionId: mission.id,
      installationId: 'installation-1',
      githubRepositoryId: '9007199254740991',
      pullNumber: 42,
    });
  });

  it.each([
    ['REVIEW_PENDING' as const, 'SUBMITTED' as const, '검토 중', '0%'],
    ['RETURNED' as const, 'MISSING' as const, '수정 필요', '0%'],
    ['APPROVED' as const, 'VERIFIED' as const, '승인됨', '100%'],
  ])(
    'renders %s review state while target Diff remains %s',
    async (state, status, stateLabel, percentage) => {
      const user = userEvent.setup();
      diffStatus = status;
      missions = [
        {
          ...mission,
          state,
          binding: {
            installationId: 'installation-owner',
            githubRepositoryId: '9007199254740991',
            pullNumber: 42,
            repositoryName: 'owner-account/private-proof',
            repositoryPrivate: true,
            pullTitle: 'private title sentinel',
            pullUrl: 'https://github.example/private/pull/42',
          },
          currentVerificationRun: {
            id: 'run-private',
            status: 'PASS',
            headSha: 'deadbeef-private-sha',
            observedAt: '2026-08-25T06:30:00.000Z',
            stale: false,
            criteria: [
              {
                criterionId: 'criterion-1',
                position: 0,
                type: 'MERGED_PR',
                passed: true,
                detail: null,
              },
            ],
          },
          currentReview:
            state === 'APPROVED' || state === 'RETURNED'
              ? {
                  id: 'review-private',
                  verificationRunId: 'run-private',
                  decision: state === 'APPROVED' ? 'APPROVED' : 'RETURNED',
                  note: null,
                  reviewedAt: '2026-08-25T06:35:00.000Z',
                }
              : null,
        },
      ];
      render(<CareerWorkspace />);

      await user.click(screen.getByRole('button', { name: '증명 미션 열기' }));

      expect(screen.getAllByText(stateLabel, { exact: true })[0]).toBeInTheDocument();
      expect(screen.getByText(percentage, { exact: true })).toBeInTheDocument();
      expect(
        screen.queryByText(
          /deadbeef-private-sha|private title sentinel|owner-account\/private-proof/,
        ),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/채용 점수|합격 가능성|지원자 순위/)).not.toBeInTheDocument();
    },
  );
});
