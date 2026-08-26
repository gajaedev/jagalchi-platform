import { http, HttpResponse } from 'msw';

import type {
  CareerCompetency,
  CareerEvidence,
  CareerReviewQueueItem,
  CareerTarget,
  CreateCareerEvidenceInput,
  CreateCareerTargetInput,
  ProofCriterion,
  ProofCriterionConfig,
  ProofMission,
  ProofReview,
  ProofReviewCriterion,
  ProofReviewDecision,
  ProofReviewQueueItem,
  ProofVerificationRun,
} from '@/api/career';
import type { OwnerProofProfile, PublicProofProfileV1 } from '@/api/proof-profile';

const competencies: CareerCompetency[] = [
  [
    'javascript',
    'JavaScript',
    'FOUNDATION',
    '언어 기본기와 비동기 실행 모델을 실제 코드로 설명합니다.',
  ],
  ['typescript', 'TypeScript', 'FOUNDATION', '타입 모델링으로 런타임 오류와 변경 비용을 줄입니다.'],
  ['react', 'React', 'FRONTEND', '컴포넌트와 상태를 제품 요구사항에 맞게 설계합니다.'],
  [
    'state-management',
    '상태 관리',
    'FRONTEND',
    '서버·클라이언트 상태의 책임과 동기화 전략을 설계합니다.',
  ],
  ['testing', '테스트 전략', 'ENGINEERING', '위험에 맞는 단위·통합·E2E 테스트를 설계합니다.'],
  ['web-performance', '웹 성능', 'FRONTEND', '측정 가능한 지표를 기준으로 병목을 찾고 개선합니다.'],
  [
    'accessibility',
    '웹 접근성',
    'FRONTEND',
    '키보드·스크린리더·명도 기준을 포함한 접근성을 구현합니다.',
  ],
  [
    'api-integration',
    'API 통합',
    'ENGINEERING',
    'API 계약, 오류, 인증, 캐시와 재시도를 안정적으로 다룹니다.',
  ],
  [
    'architecture',
    '프론트엔드 아키텍처',
    'ENGINEERING',
    '도메인 경계와 의존성을 장기 변경에 유리하게 설계합니다.',
  ],
  [
    'collaboration',
    '협업과 코드 리뷰',
    'ENGINEERING',
    'PR, 리뷰, 문서와 합의를 통해 팀 변경을 안전하게 전달합니다.',
  ],
  ['ci-cd', 'CI/CD', 'DELIVERY', '검증과 배포를 자동화해 반복 가능한 릴리스를 만듭니다.'],
  ['deployment', '배포와 운영', 'DELIVERY', '서비스를 배포하고 로그·오류·성능을 관측합니다.'],
].map(([slug, label, category, description]) => ({
  slug,
  label,
  category: category as CareerCompetency['category'],
  description,
}));

const targets: CareerTarget[] = [];
const evidence: CareerEvidence[] = [];
const missions: ProofMission[] = [];
const verificationRuns: ProofVerificationRun[] = [];
const reviews: ProofReview[] = [];
const commandResults = new Map<string, string>();
const publications = new Map<string, OwnerProofProfile['proofs'][number]>();

const PUBLIC_ID = 'proof-public-safe-7Kp2mQ';
const FIXED_TIME = Date.parse('2026-08-25T08:00:00.000Z');
let clockTick = 0;
let targetSequence = 0;
let evidenceSequence = 0;
let missionSequence = 0;
let criterionSequence = 0;
let runSequence = 0;
let reviewSequence = 0;
let publicProofSequence = 0;
let profileUpdatedAt = '2026-08-25T08:00:00.000Z';
let ownerProfile: Omit<OwnerProofProfile, 'proofs'> = {
  state: 'DISABLED',
  publicId: PUBLIC_ID,
  displayName: '김자갈',
  summary: '',
};

function now() {
  const value = new Date(FIXED_TIME + clockTick * 1_000).toISOString();
  clockTick += 1;
  return value;
}

function futureLease() {
  return new Date(FIXED_TIME + clockTick * 1_000 + 30 * 24 * 60 * 60 * 1_000).toISOString();
}

function error(status: number, code: string, message: string) {
  return HttpResponse.json({ statusCode: status, code, message }, { status });
}

function missionById(missionId: string) {
  return missions.find((mission) => mission.id === missionId);
}

function reviewerProofMission(mission: ProofMission): ProofReviewQueueItem {
  const competencyLabel =
    competencies.find((competency) => competency.slug === mission.competencySlug)?.label ??
    mission.competencySlug;

  return {
    id: mission.id,
    targetId: mission.targetId,
    title: mission.title,
    summary: mission.summary,
    state: mission.state,
    competencySlug: mission.competencySlug,
    competencyLabel,
    ownerDisplayName: '미션 소유자',
    submittedAt: mission.updatedAt,
    criteria: mission.criteria.map((criterion): ProofReviewCriterion =>
      criterion.type === 'HUMAN_CHECK'
        ? {
            position: criterion.position,
            type: criterion.type,
            config: { label: criterion.config.label },
          }
        : {
            position: criterion.position,
            type: criterion.type,
            config: {},
          },
    ),
    currentVerificationRun: mission.currentVerificationRun
      ? {
          status: mission.currentVerificationRun.status,
          observedAt: mission.currentVerificationRun.observedAt,
          results: mission.currentVerificationRun.criteria.map(
            ({ position, type, passed, detail }) => ({
              position,
              type,
              passed,
              detail,
            }),
          ),
        }
      : null,
  };
}

function reviewerCareerEvidence(item: CareerEvidence): CareerReviewQueueItem {
  return {
    id: item.id,
    title: item.title,
    url: item.url,
    kind: item.kind,
    description: item.description,
    competencySlugs: item.competencySlugs,
    status: item.status,
    reviewNote: item.reviewNote,
    reviewedAt: item.reviewedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function requireIdempotency(input: unknown) {
  if (
    !input ||
    typeof input !== 'object' ||
    typeof (input as { idempotencyKey?: unknown }).idempotencyKey !== 'string' ||
    !(input as { idempotencyKey: string }).idempotencyKey.trim()
  ) {
    return error(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Idempotency key is required');
  }
  return null;
}

function replay(command: string, idempotencyKey: string) {
  const missionId = commandResults.get(`${command}:${idempotencyKey}`);
  return missionId ? missionById(missionId) : undefined;
}

function remember(command: string, idempotencyKey: string, missionId: string) {
  commandResults.set(`${command}:${idempotencyKey}`, missionId);
}

function invalidateMission(mission: ProofMission) {
  if (mission.currentVerificationRun) {
    mission.currentVerificationRun = { ...mission.currentVerificationRun, stale: true };
  }
  mission.currentReview = null;
  const publication = publications.get(mission.id);
  if (publication) {
    publications.set(mission.id, {
      ...publication,
      publicationState: 'INVALIDATED',
      isPublished: false,
    });
  }
}

function isCriterionConfig(value: unknown): value is ProofCriterionConfig {
  if (!value || typeof value !== 'object') return false;
  const criterion = value as { type?: unknown; config?: unknown };
  if (
    !criterion.config ||
    typeof criterion.config !== 'object' ||
    Array.isArray(criterion.config)
  ) {
    return false;
  }
  const config = criterion.config as Record<string, unknown>;
  if (criterion.type === 'MERGED_PR') return Object.keys(config).length === 0;
  if (Object.keys(config).length !== 1) return false;
  if (criterion.type === 'BASE_BRANCH')
    return typeof config.branch === 'string' && Boolean(config.branch);
  if (criterion.type === 'CHANGED_PATH')
    return typeof config.glob === 'string' && Boolean(config.glob);
  if (criterion.type === 'NAMED_CHECK')
    return typeof config.context === 'string' && Boolean(config.context);
  if (criterion.type === 'HUMAN_CHECK')
    return typeof config.label === 'string' && Boolean(config.label);
  return false;
}

function criterionDetail(type: ProofCriterion['type'], passed: boolean) {
  if (passed) return 'Provider fact satisfied this criterion.';
  return type === 'MERGED_PR'
    ? 'Pull request is not merged.'
    : 'Provider fact did not satisfy this criterion.';
}

function ownerProofProfile() {
  return {
    ...ownerProfile,
    proofs: [...publications.values()].map((proof) => ({
      missionId: proof.missionId,
      state: proof.publicationState,
      validUntil: proof.validUntil,
      snapshot: {
        schemaVersion: 1,
        publicProofId: proof.publicProofId,
        title: proof.title,
        summary: proof.summary,
        competencyLabel: proof.competencyLabel,
        provider: 'GITHUB',
        verification: { status: 'VERIFIED', verifiedAt: proof.verifiedAt },
        criteria: proof.criteria,
      },
    })),
  };
}

function publicProfile(publicId: string): PublicProofProfileV1 | null {
  if (
    ownerProfile.state !== 'ENABLED' ||
    ownerProfile.publicId !== publicId ||
    publications.size === 0
  ) {
    return null;
  }
  const proofs = [...publications.values()]
    .filter(
      (proof) =>
        proof.publicationState === 'ACTIVE' && new Date(proof.validUntil).getTime() > Date.now(),
    )
    .map((proof) => ({
      publicProofId: proof.publicProofId,
      title: proof.title,
      summary: proof.summary,
      competencyLabel: proof.competencyLabel,
      provider: 'GITHUB' as const,
      verification: { status: 'VERIFIED' as const, verifiedAt: proof.verifiedAt },
      criteria: {
        passedCount: proof.criteria.passedCount,
        totalCount: proof.criteria.totalCount,
        types: [...proof.criteria.types],
      },
    }));
  if (proofs.length === 0) return null;
  return {
    schemaVersion: 1,
    profile: {
      publicId,
      displayName: ownerProfile.displayName,
      summary: ownerProfile.summary || null,
    },
    proofs,
    updatedAt: profileUpdatedAt,
  };
}

function publicProfileResponse(publicId: string) {
  const profile = publicProfile(publicId);
  if (!profile) {
    return HttpResponse.json(
      {
        statusCode: 404,
        code: 'PROOF_PROFILE_NOT_FOUND',
        message: 'Proof Profile not found',
      },
      {
        status: 404,
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      },
    );
  }
  return HttpResponse.json(profile, {
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export const careerHandlers = [
  http.get('/api/career/competencies', () => HttpResponse.json(competencies)),

  http.get('/api/career/targets', () => HttpResponse.json(targets)),

  http.post<Record<string, never>, CreateCareerTargetInput>(
    '/api/career/targets',
    async ({ request }) => {
      const input = await request.json();
      const unknownCompetency = input.competencySlugs.find(
        (slug) => !competencies.some((competency) => competency.slug === slug),
      );
      if (unknownCompetency) {
        return error(400, 'CAREER_COMPETENCY_INVALID', 'Unknown career competency');
      }
      const createdAt = now();
      const target: CareerTarget = {
        id: `target-${++targetSequence}`,
        userId: 'user-1',
        company: input.company,
        role: input.role,
        postingUrl: input.postingUrl ?? null,
        requirements: input.requirements,
        competencySlugs: [...new Set(input.competencySlugs)],
        status: 'ACTIVE',
        createdAt,
        updatedAt: createdAt,
      };
      targets.unshift(target);
      return HttpResponse.json(target, { status: 201 });
    },
  ),

  http.get<{ id: string }>('/api/career/targets/:id/diff', ({ params }) => {
    const target = targets.find((item) => item.id === params.id);
    if (!target) return error(404, 'CAREER_TARGET_NOT_FOUND', 'Career target not found');
    const items = target.competencySlugs.flatMap((slug) => {
      const competency = competencies.find((item) => item.slug === slug);
      if (!competency) return [];
      const legacyEvidence = evidence.filter(
        (item) => item.competencySlugs.includes(slug) && item.status !== 'REJECTED',
      );
      const approvedMission = missions.find(
        (mission) =>
          mission.targetId === target.id &&
          mission.competencySlug === slug &&
          mission.state === 'APPROVED' &&
          mission.currentVerificationRun?.status === 'PASS' &&
          mission.currentVerificationRun.stale === false &&
          mission.currentReview?.decision === 'APPROVED' &&
          mission.currentReview.verificationRunId === mission.currentVerificationRun.id,
      );
      const status = approvedMission ? 'VERIFIED' : legacyEvidence.length ? 'SUBMITTED' : 'MISSING';
      return [{ ...competency, status, evidence: legacyEvidence }];
    });
    const verifiedCount = items.filter((item) => item.status === 'VERIFIED').length;
    const submittedCount = items.filter((item) => item.status === 'SUBMITTED').length;
    return HttpResponse.json({
      target,
      summary: {
        requiredCount: items.length,
        verifiedCount,
        submittedCount,
        missingCount: items.length - verifiedCount - submittedCount,
        verifiedPercentage: items.length ? Math.round((verifiedCount / items.length) * 100) : 0,
      },
      competencies: items,
    });
  }),

  http.get('/api/career/evidence', () => HttpResponse.json(evidence)),

  http.post<Record<string, never>, CreateCareerEvidenceInput>(
    '/api/career/evidence',
    async ({ request }) => {
      const input = await request.json();
      const createdAt = now();
      const item: CareerEvidence = {
        id: `evidence-${++evidenceSequence}`,
        userId: 'user-1',
        title: input.title,
        url: input.url,
        kind: input.kind,
        description: input.description ?? '',
        competencySlugs: input.competencySlugs,
        status: 'SUBMITTED',
        reviewerId: null,
        reviewNote: null,
        reviewedAt: null,
        createdAt,
        updatedAt: createdAt,
      };
      evidence.unshift(item);
      return HttpResponse.json(item, { status: 201 });
    },
  ),

  http.get('/api/career/reviews', () =>
    HttpResponse.json(
      evidence.filter((item) => item.status === 'SUBMITTED').map(reviewerCareerEvidence),
    ),
  ),

  http.patch<{ evidenceId: string }>(
    '/api/career/evidence/:evidenceId/review',
    async ({ params, request }) => {
      const item = evidence.find((candidate) => candidate.id === params.evidenceId);
      if (!item) return error(404, 'CAREER_EVIDENCE_NOT_FOUND', 'Career evidence not found');
      const input = (await request.json()) as { status?: unknown; reviewNote?: unknown };
      if (input.status !== 'VERIFIED' && input.status !== 'REJECTED') {
        return error(400, 'CAREER_REVIEW_DECISION_INVALID', 'Review decision is invalid');
      }
      if (input.status === 'REJECTED' && typeof input.reviewNote !== 'string') {
        return error(400, 'CAREER_REVIEW_NOTE_REQUIRED', 'Returned evidence requires a note');
      }
      item.status = input.status;
      item.reviewerId = 'reviewer-2';
      item.reviewNote = typeof input.reviewNote === 'string' ? input.reviewNote : null;
      item.reviewedAt = now();
      item.updatedAt = item.reviewedAt;
      return HttpResponse.json(reviewerCareerEvidence(item));
    },
  ),

  http.get('/api/career/proof-missions', ({ request }) => {
    const targetId = new URL(request.url).searchParams.get('targetId');
    if (targetId && !targets.some((target) => target.id === targetId)) {
      return error(404, 'CAREER_TARGET_NOT_FOUND', 'Career target not found');
    }
    return HttpResponse.json(
      missions.filter((mission) => !targetId || mission.targetId === targetId),
    );
  }),

  http.post('/api/career/proof-missions', async ({ request }) => {
    const input = (await request.json()) as {
      targetId?: unknown;
      competencySlug?: unknown;
      title?: unknown;
      summary?: unknown;
      idempotencyKey?: unknown;
    };
    const idempotencyError = requireIdempotency(input);
    if (idempotencyError) return idempotencyError;
    const idempotencyKey = input.idempotencyKey as string;
    const replayed = replay('CREATE_MISSION', idempotencyKey);
    if (replayed) return HttpResponse.json(replayed);
    const target = targets.find((item) => item.id === input.targetId);
    if (!target) return error(404, 'CAREER_TARGET_NOT_FOUND', 'Career target not found');
    if (
      typeof input.competencySlug !== 'string' ||
      !target.competencySlugs.includes(input.competencySlug)
    ) {
      return error(400, 'MISSION_COMPETENCY_OUT_OF_SCOPE', 'Competency does not belong to target');
    }
    if (
      missions.some(
        (mission) =>
          mission.targetId === target.id && mission.competencySlug === input.competencySlug,
      )
    ) {
      return error(
        409,
        'MISSION_ALREADY_EXISTS',
        'A mission already exists for this target competency',
      );
    }
    const createdAt = now();
    const competency = competencies.find((item) => item.slug === input.competencySlug)!;
    const mission: ProofMission = {
      id: `mission-${++missionSequence}`,
      targetId: target.id,
      competencySlug: input.competencySlug,
      competencyLabel: competency.label,
      title: typeof input.title === 'string' ? input.title : `${competency.label} 역량 증명`,
      summary: typeof input.summary === 'string' ? input.summary : null,
      state: 'DRAFT',
      criteriaVersion: 1,
      bindingVersion: 0,
      binding: null,
      criteria: [],
      currentVerificationRun: null,
      currentReview: null,
      createdAt,
      updatedAt: createdAt,
    };
    missions.unshift(mission);
    remember('CREATE_MISSION', idempotencyKey, mission.id);
    return HttpResponse.json(mission, { status: 201 });
  }),

  http.get<{ missionId: string }>('/api/career/proof-missions/:missionId', ({ params }) => {
    const mission = missionById(params.missionId);
    return mission
      ? HttpResponse.json(mission)
      : error(404, 'PROOF_MISSION_NOT_FOUND', 'Proof mission not found');
  }),

  http.put<{ missionId: string }>(
    '/api/career/proof-missions/:missionId/criteria',
    async ({ params, request }) => {
      const mission = missionById(params.missionId);
      if (!mission) return error(404, 'PROOF_MISSION_NOT_FOUND', 'Proof mission not found');
      const input = (await request.json()) as { criteria?: unknown; idempotencyKey?: unknown };
      const idempotencyError = requireIdempotency(input);
      if (idempotencyError) return idempotencyError;
      const idempotencyKey = input.idempotencyKey as string;
      const replayed = replay(`CRITERIA:${mission.id}`, idempotencyKey);
      if (replayed) return HttpResponse.json(replayed);
      if (!['DRAFT', 'BOUND', 'RETURNED'].includes(mission.state)) {
        return error(409, 'MISSION_STATE_CONFLICT', 'Criteria cannot be changed in this state');
      }
      if (
        !Array.isArray(input.criteria) ||
        input.criteria.length === 0 ||
        !input.criteria.every(isCriterionConfig)
      ) {
        return error(
          400,
          'PROOF_CRITERIA_INVALID',
          'Criteria must use the finite criterion contract',
        );
      }
      mission.criteria = input.criteria.map((criterion, position) => ({
        id: `criterion-${++criterionSequence}`,
        position,
        type: criterion.type,
        config: { ...criterion.config },
      }));
      mission.criteriaVersion += 1;
      mission.state = mission.binding ? 'BOUND' : 'DRAFT';
      invalidateMission(mission);
      mission.updatedAt = now();
      remember(`CRITERIA:${mission.id}`, idempotencyKey, mission.id);
      return HttpResponse.json(mission);
    },
  ),

  http.post<{ missionId: string }>(
    '/api/career/proof-missions/:missionId/bind',
    async ({ params, request }) => {
      const mission = missionById(params.missionId);
      if (!mission) return error(404, 'PROOF_MISSION_NOT_FOUND', 'Proof mission not found');
      const input = (await request.json()) as {
        installationId?: unknown;
        githubRepositoryId?: unknown;
        pullNumber?: unknown;
        idempotencyKey?: unknown;
      };
      const idempotencyError = requireIdempotency(input);
      if (idempotencyError) return idempotencyError;
      const idempotencyKey = input.idempotencyKey as string;
      const replayed = replay(`BIND:${mission.id}`, idempotencyKey);
      if (replayed) return HttpResponse.json(replayed);
      if (input.installationId !== 'installation-personal-read-only-1') {
        return error(409, 'GITHUB_INSTALLATION_INACTIVE', 'GitHub installation is inactive');
      }
      if (
        input.githubRepositoryId !== '90071992547409931234' &&
        input.githubRepositoryId !== '424242'
      ) {
        return error(404, 'GITHUB_REPOSITORY_NOT_AUTHORIZED', 'Repository is not authorized');
      }
      const pullNumber = Number(input.pullNumber);
      const pullFixtures = input.githubRepositoryId === '424242' ? [7] : [42, 43, 44];
      if (!Number.isSafeInteger(pullNumber) || !pullFixtures.includes(pullNumber)) {
        return error(404, 'GITHUB_PR_NOT_FOUND', 'Pull request was not found');
      }
      invalidateMission(mission);
      mission.bindingVersion += 1;
      mission.state = 'BOUND';
      mission.binding = {
        installationId: input.installationId,
        githubRepositoryId: input.githubRepositoryId,
        pullNumber,
        repositoryName:
          input.githubRepositoryId === '424242'
            ? 'mock-developer/accessibility-lab'
            : 'mock-developer/jagalchi-web',
        repositoryPrivate: false,
        pullTitle:
          pullNumber === 42
            ? '테스트 가능한 결제 흐름 추가'
            : pullNumber === 43
              ? '실패한 검증 경로'
              : pullNumber === 44
                ? '새 head가 생긴 검증 경로'
                : '키보드 탐색 개선',
        pullUrl:
          input.githubRepositoryId === '424242'
            ? 'https://github.com/mock-developer/accessibility-lab/pull/7'
            : `https://github.com/mock-developer/jagalchi-web/pull/${pullNumber}`,
      };
      mission.updatedAt = now();
      remember(`BIND:${mission.id}`, idempotencyKey, mission.id);
      return HttpResponse.json(mission);
    },
  ),

  http.post<{ missionId: string }>(
    '/api/career/proof-missions/:missionId/refresh',
    async ({ params, request }) => {
      const mission = missionById(params.missionId);
      if (!mission) return error(404, 'PROOF_MISSION_NOT_FOUND', 'Proof mission not found');
      const input = (await request.json()) as { idempotencyKey?: unknown };
      const idempotencyError = requireIdempotency(input);
      if (idempotencyError) return idempotencyError;
      const idempotencyKey = input.idempotencyKey as string;
      const replayed = replay(`REFRESH:${mission.id}`, idempotencyKey);
      if (replayed) return HttpResponse.json(replayed);
      if (!mission.binding) return error(409, 'MISSION_NOT_BOUND', 'Mission is not bound');
      if (mission.criteria.length === 0)
        return error(409, 'PROOF_CRITERIA_REQUIRED', 'At least one criterion is required');
      const failed = mission.binding.pullNumber === 43;
      const stale = mission.binding.pullNumber === 44;
      const run: ProofVerificationRun = {
        id: `run-${++runSequence}`,
        status: failed ? 'FAIL' : 'PASS',
        headSha:
          mission.binding.pullNumber === 42
            ? '1111111111111111111111111111111111111111'
            : mission.binding.pullNumber === 43
              ? '2222222222222222222222222222222222222222'
              : mission.binding.pullNumber === 44
                ? '3333333333333333333333333333333333333333'
                : '7777777777777777777777777777777777777777',
        observedAt: now(),
        stale,
        criteria: mission.criteria.map((criterion) => ({
          criterionId: criterion.id,
          position: criterion.position,
          type: criterion.type,
          passed: !failed,
          detail: criterionDetail(criterion.type, !failed),
        })),
      };
      verificationRuns.push(run);
      mission.currentVerificationRun = run;
      mission.currentReview = null;
      mission.state = 'BOUND';
      const publication = publications.get(mission.id);
      if (publication) {
        publications.set(mission.id, {
          ...publication,
          publicationState: 'INVALIDATED',
          isPublished: false,
        });
      }
      mission.updatedAt = now();
      remember(`REFRESH:${mission.id}`, idempotencyKey, mission.id);
      return HttpResponse.json(mission);
    },
  ),

  http.post<{ missionId: string }>(
    '/api/career/proof-missions/:missionId/submit',
    async ({ params, request }) => {
      const mission = missionById(params.missionId);
      if (!mission) return error(404, 'PROOF_MISSION_NOT_FOUND', 'Proof mission not found');
      const input = (await request.json()) as { idempotencyKey?: unknown };
      const idempotencyError = requireIdempotency(input);
      if (idempotencyError) return idempotencyError;
      const idempotencyKey = input.idempotencyKey as string;
      const replayed = replay(`SUBMIT:${mission.id}`, idempotencyKey);
      if (replayed) return HttpResponse.json(replayed);
      if (
        mission.currentVerificationRun?.status !== 'PASS' ||
        mission.currentVerificationRun.stale
      ) {
        return error(
          409,
          'CURRENT_PASS_REQUIRED',
          'A current passing verification run is required',
        );
      }
      mission.state = 'REVIEW_PENDING';
      mission.currentReview = null;
      mission.updatedAt = now();
      remember(`SUBMIT:${mission.id}`, idempotencyKey, mission.id);
      return HttpResponse.json(mission);
    },
  ),

  http.get('/api/career/proof-reviews', () => {
    const queue: ProofReviewQueueItem[] = missions
      .filter((mission) => mission.state === 'REVIEW_PENDING')
      .map(reviewerProofMission);
    return HttpResponse.json(queue);
  }),

  http.post<{ missionId: string }>(
    '/api/career/proof-missions/:missionId/review',
    async ({ params, request }) => {
      const mission = missionById(params.missionId);
      if (!mission) return error(404, 'PROOF_MISSION_NOT_FOUND', 'Proof mission not found');
      if (request.headers.get('x-mock-user-id') === 'user-1') {
        return error(
          403,
          'SELF_REVIEW_FORBIDDEN',
          'Mission owners cannot review their own mission',
        );
      }
      const input = (await request.json()) as {
        decision?: ProofReviewDecision;
        note?: unknown;
        idempotencyKey?: unknown;
      };
      const idempotencyError = requireIdempotency(input);
      if (idempotencyError) return idempotencyError;
      const idempotencyKey = input.idempotencyKey as string;
      const replayed = replay(`REVIEW:${mission.id}`, idempotencyKey);
      if (replayed) return HttpResponse.json(reviewerProofMission(replayed));
      if (mission.state !== 'REVIEW_PENDING' || !mission.currentVerificationRun) {
        return error(409, 'MISSION_REVIEW_NOT_PENDING', 'Mission is not pending review');
      }
      if (input.decision !== 'APPROVED' && input.decision !== 'RETURNED') {
        return error(400, 'PROOF_REVIEW_DECISION_INVALID', 'Review decision is invalid');
      }
      if (input.decision === 'RETURNED' && (typeof input.note !== 'string' || !input.note.trim())) {
        return error(400, 'PROOF_REVIEW_NOTE_REQUIRED', 'Returned review requires a note');
      }
      const review: ProofReview = {
        id: `review-${++reviewSequence}`,
        verificationRunId: mission.currentVerificationRun.id,
        decision: input.decision,
        note: typeof input.note === 'string' ? input.note : null,
        reviewedAt: now(),
      };
      reviews.push(review);
      mission.currentReview = review;
      mission.state = input.decision === 'APPROVED' ? 'APPROVED' : 'RETURNED';
      mission.updatedAt = now();
      remember(`REVIEW:${mission.id}`, idempotencyKey, mission.id);
      return HttpResponse.json(reviewerProofMission(mission));
    },
  ),

  http.get('/api/career/proof-profile', () => HttpResponse.json(ownerProofProfile())),

  http.put('/api/career/proof-profile', async ({ request }) => {
    const input = (await request.json()) as {
      state?: unknown;
      displayName?: unknown;
      summary?: unknown;
      idempotencyKey?: unknown;
    };
    const idempotencyError = requireIdempotency(input);
    if (idempotencyError) return idempotencyError;
    if (input.state !== 'DISABLED' && input.state !== 'ENABLED') {
      return error(400, 'PROOF_PROFILE_STATE_INVALID', 'Proof Profile state is invalid');
    }
    if (typeof input.displayName !== 'string' || !input.displayName.trim()) {
      return error(400, 'PROOF_PROFILE_DISPLAY_NAME_REQUIRED', 'Display name is required');
    }
    ownerProfile = {
      state: input.state,
      publicId: PUBLIC_ID,
      displayName: input.displayName,
      summary: typeof input.summary === 'string' ? input.summary : '',
    };
    profileUpdatedAt = now();
    return HttpResponse.json(ownerProofProfile());
  }),

  http.post<{ missionId: string }>(
    '/api/career/proof-profile/publish/:missionId',
    async ({ params, request }) => {
      const mission = missionById(params.missionId);
      if (!mission) return error(404, 'PROOF_MISSION_NOT_FOUND', 'Proof mission not found');
      const input = (await request.json()) as {
        idempotencyKey?: unknown;
      };
      const idempotencyError = requireIdempotency(input);
      if (idempotencyError) return idempotencyError;
      if (Object.keys(input).some((key) => key !== 'idempotencyKey')) {
        return error(400, 'PROOF_PUBLISH_BODY_INVALID', 'Publish body is invalid');
      }
      if (
        mission.state !== 'APPROVED' ||
        mission.currentVerificationRun?.status !== 'PASS' ||
        mission.currentVerificationRun.stale ||
        mission.currentReview?.decision !== 'APPROVED' ||
        mission.currentReview.verificationRunId !== mission.currentVerificationRun.id
      ) {
        return error(409, 'PROOF_NOT_ELIGIBLE', 'Proof is not eligible for publication');
      }
      const existing = publications.get(mission.id);
      if (existing && new Date(existing.validUntil).getTime() <= Date.now()) {
        return error(
          409,
          'PUBLICATION_LEASE_EXPIRED',
          'Publication lease expired; renew the publication lease before publishing',
        );
      }
      publications.set(mission.id, {
        missionId: mission.id,
        publicProofId: existing?.publicProofId ?? `public-proof-${++publicProofSequence}`,
        title: mission.title,
        summary: mission.summary,
        competencyLabel: mission.competencyLabel,
        verifiedAt: mission.currentVerificationRun.observedAt,
        criteria: {
          passedCount: mission.currentVerificationRun.criteria.filter(
            (criterion) => criterion.passed,
          ).length,
          totalCount: mission.currentVerificationRun.criteria.length,
          types: mission.currentVerificationRun.criteria.map((criterion) => criterion.type),
        },
        publicationState: 'ACTIVE',
        validUntil: futureLease(),
        isPublished: true,
      });
      profileUpdatedAt = now();
      const published = ownerProofProfile().proofs.find((proof) => proof.missionId === mission.id);
      return HttpResponse.json(published, { status: 201 });
    },
  ),

  http.post<{ missionId: string }>(
    '/api/career/proof-profile/renew/:missionId',
    async ({ params, request }) => {
      const input = (await request.json()) as { idempotencyKey?: unknown };
      const idempotencyError = requireIdempotency(input);
      if (idempotencyError) return idempotencyError;
      const publication = publications.get(params.missionId);
      if (!publication) {
        return error(404, 'PUBLISHED_PROOF_NOT_FOUND', 'Published proof not found');
      }
      if (
        publication.publicationState !== 'ACTIVE' &&
        publication.publicationState !== 'UNPUBLISHED'
      ) {
        return error(409, 'PUBLISHED_PROOF_NOT_ACTIVE', 'Published proof is not active');
      }
      const mission = missionById(params.missionId);
      if (
        !mission ||
        mission.state !== 'APPROVED' ||
        mission.currentVerificationRun?.status !== 'PASS' ||
        mission.currentVerificationRun.stale ||
        mission.currentReview?.decision !== 'APPROVED' ||
        mission.currentReview.verificationRunId !== mission.currentVerificationRun.id
      ) {
        if (mission) invalidateMission(mission);
        return error(
          409,
          'PUBLICATION_VERIFICATION_CHANGED',
          'Verification changed; refresh and re-review are required',
        );
      }
      const validUntil = futureLease();
      publications.set(params.missionId, {
        ...publication,
        validUntil,
        isPublished: publication.publicationState === 'ACTIVE',
      });
      profileUpdatedAt = now();
      return HttpResponse.json({ renewed: true, validUntil });
    },
  ),

  http.post<{ missionId: string }>(
    '/api/career/proof-profile/unpublish/:missionId',
    async ({ params, request }) => {
      const input = (await request.json()) as { idempotencyKey?: unknown };
      const idempotencyError = requireIdempotency(input);
      if (idempotencyError) return idempotencyError;
      const publication = publications.get(params.missionId);
      if (publication) {
        publications.set(params.missionId, {
          ...publication,
          publicationState: 'UNPUBLISHED',
          isPublished: false,
        });
        profileUpdatedAt = now();
      }
      return HttpResponse.json({ unpublished: true });
    },
  ),

  http.get<{ publicId: string }>('/api/career/proof-profiles/public/:publicId', ({ params }) =>
    publicProfileResponse(params.publicId),
  ),

  http.get<{ publicId: string }>('/api/career/proof-profiles/:publicId', ({ params }) =>
    publicProfileResponse(params.publicId),
  ),

  http.get(/\/career\/proof-profiles\/(?:public\/)?[^/?]+$/, ({ request }) => {
    const publicId = decodeURIComponent(new URL(request.url).pathname.split('/').pop() ?? '');
    return publicProfileResponse(publicId);
  }),
];
