import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./client', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

import { apiClient } from './client';
import {
  bindProofMission,
  createCareerEvidence,
  createProofMission,
  createCareerTarget,
  getCareerDiff,
  getProofMission,
  listCareerCompetencies,
  listCareerEvidence,
  listCareerReviews,
  listCareerTargets,
  listProofMissions,
  listProofReviews,
  refreshProofVerification,
  replaceProofCriteria,
  reviewCareerEvidence,
  reviewProofMission,
  submitProofMission,
  type ReplaceProofCriteriaInput,
} from './career';
import {
  getOwnerProofProfile,
  publishOwnerProof,
  unpublishOwnerProof,
  updateOwnerProofProfile,
} from './proof-profile';

describe('Career API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads the finite competency catalog and private collections', () => {
    listCareerCompetencies();
    listCareerTargets();
    listCareerEvidence();
    listCareerReviews();
    listProofReviews();

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/career/competencies');
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/career/targets');
    expect(apiClient.get).toHaveBeenNthCalledWith(3, '/career/evidence');
    expect(apiClient.get).toHaveBeenNthCalledWith(4, '/career/reviews');
    expect(apiClient.get).toHaveBeenNthCalledWith(5, '/career/proof-reviews');
  });

  it('creates an explicit target without AI parsing', () => {
    const input = {
      company: '토스',
      role: '프론트엔드 개발자',
      requirements: 'React와 TypeScript 기반 제품 개발 경험이 필요합니다.',
      competencySlugs: ['react', 'typescript'],
    };
    createCareerTarget(input);
    expect(apiClient.post).toHaveBeenCalledWith('/career/targets', input);
  });

  it('loads the authoritative diff for a UUID target', () => {
    getCareerDiff('11111111-1111-4111-8111-111111111111');
    expect(apiClient.get).toHaveBeenCalledWith(
      '/career/targets/11111111-1111-4111-8111-111111111111/diff',
    );
  });

  it('submits legacy evidence for review instead of marking it verified', () => {
    const input = {
      title: '성능 개선 PR',
      url: 'https://github.com/example/repo/pull/1',
      kind: 'GITHUB_PULL_REQUEST' as const,
      competencySlugs: ['web-performance'],
    };
    createCareerEvidence(input);
    expect(apiClient.post).toHaveBeenCalledWith('/career/evidence', input);
  });

  it('sends legacy reviewer decisions through the protected endpoint', () => {
    const input = { status: 'REJECTED' as const, reviewNote: '성능 전후 수치를 추가해주세요.' };
    reviewCareerEvidence('evidence-1', input);
    expect(apiClient.patch).toHaveBeenCalledWith('/career/evidence/evidence-1/review', input);
  });

  it('creates and reads one target-scoped mission with the caller idempotency key', () => {
    const input = {
      targetId: 'target-1',
      competencySlug: 'testing',
      title: '테스트 전략 역량 증명',
      summary: '실패 경로까지 검증합니다.',
      idempotencyKey: 'mission-command-1',
    };
    createProofMission(input);
    listProofMissions('target/id with spaces');
    getProofMission('mission-1');

    expect(apiClient.post).toHaveBeenCalledWith('/career/proof-missions', input);
    expect(apiClient.get).toHaveBeenNthCalledWith(
      1,
      '/career/proof-missions?targetId=target%2Fid%20with%20spaces',
    );
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/career/proof-missions/mission-1');
  });

  it('replaces criteria with only finite discriminated configs', () => {
    const input: ReplaceProofCriteriaInput = {
      criteria: [
        { type: 'MERGED_PR', config: {} },
        { type: 'BASE_BRANCH', config: { branch: 'main' } },
        { type: 'CHANGED_PATH', config: { glob: 'apps/web/**' } },
        { type: 'NAMED_CHECK', config: { context: 'test' } },
        { type: 'HUMAN_CHECK', config: { label: '비자명한 검토' } },
      ],
      idempotencyKey: 'criteria-command-1',
    };
    replaceProofCriteria('mission-1', input);
    expect(apiClient.put).toHaveBeenCalledWith('/career/proof-missions/mission-1/criteria', input);
  });

  it('binds a decimal-string repository ID without numeric coercion', () => {
    const input = {
      installationId: 'installation-1',
      githubRepositoryId: '90071992547409931234567890',
      pullNumber: 42,
      idempotencyKey: 'bind-command-1',
    };
    bindProofMission('mission-1', input);
    expect(apiClient.post).toHaveBeenCalledWith('/career/proof-missions/mission-1/bind', input);
  });

  it('serializes refresh and submit command keys in JSON bodies', () => {
    refreshProofVerification('mission-1', 'refresh-command-1');
    submitProofMission('mission-1', 'submit-command-1');

    expect(apiClient.post).toHaveBeenNthCalledWith(1, '/career/proof-missions/mission-1/refresh', {
      idempotencyKey: 'refresh-command-1',
    });
    expect(apiClient.post).toHaveBeenNthCalledWith(2, '/career/proof-missions/mission-1/submit', {
      idempotencyKey: 'submit-command-1',
    });
  });

  it('serializes immutable review decisions with their command key', () => {
    const input = {
      decision: 'RETURNED' as const,
      note: '실패 경로를 추가해주세요.',
      idempotencyKey: 'review-command-1',
    };
    reviewProofMission('mission-1', input);
    expect(apiClient.post).toHaveBeenCalledWith('/career/proof-missions/mission-1/review', input);
  });

  it('uses the owner proof profile routes and exact command bodies', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(null);
    vi.mocked(apiClient.put).mockResolvedValueOnce({
      state: 'DISABLED',
      publicId: 'proof-public-safe-7Kp2mQ',
      displayName: '김자갈',
      summary: null,
      proofs: [],
    });

    await getOwnerProofProfile();
    const update = {
      state: 'DISABLED' as const,
      displayName: '김자갈',
      summary: null,
      idempotencyKey: 'profile-command-1',
    };
    await updateOwnerProofProfile(update);
    await publishOwnerProof('mission/id', {
      idempotencyKey: 'publish-command-1',
    });
    await unpublishOwnerProof('mission/id', 'unpublish-command-1');

    expect(apiClient.get).toHaveBeenCalledWith('/career/proof-profile');
    expect(apiClient.put).toHaveBeenCalledWith('/career/proof-profile', update);
    expect(apiClient.post).toHaveBeenNthCalledWith(
      1,
      '/career/proof-profile/publish/mission%2Fid',
      { idempotencyKey: 'publish-command-1' },
    );
    expect(apiClient.post).toHaveBeenNthCalledWith(
      2,
      '/career/proof-profile/unpublish/mission%2Fid',
      { idempotencyKey: 'unpublish-command-1' },
    );
  });

  it('projects the canonical owner publication shape without exposing its wrapper', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      state: 'ENABLED',
      publicId: 'proof-public-safe-7Kp2mQ',
      displayName: '김자갈',
      summary: null,
      proofs: [
        {
          missionId: 'mission-1',
          state: 'UNPUBLISHED',
          validUntil: '2026-09-24T00:00:00.000Z',
          snapshot: {
            schemaVersion: 1,
            publicProofId: 'public-proof-1',
            title: '미션 소유 제목',
            summary: null,
            competencyLabel: 'React',
            provider: 'GITHUB',
            verification: {
              status: 'VERIFIED',
              verifiedAt: '2026-08-25T00:00:00.000Z',
            },
            criteria: { passedCount: 1, totalCount: 1, types: ['MERGED_PR'] },
          },
        },
      ],
    });

    await expect(getOwnerProofProfile()).resolves.toEqual({
      state: 'ENABLED',
      publicId: 'proof-public-safe-7Kp2mQ',
      displayName: '김자갈',
      summary: '',
      proofs: [
        {
          missionId: 'mission-1',
          publicProofId: 'public-proof-1',
          title: '미션 소유 제목',
          summary: null,
          competencyLabel: 'React',
          verifiedAt: '2026-08-25T00:00:00.000Z',
          criteria: { passedCount: 1, totalCount: 1, types: ['MERGED_PR'] },
          publicationState: 'UNPUBLISHED',
          validUntil: '2026-09-24T00:00:00.000Z',
          isPublished: false,
        },
      ],
    });
  });

  it.each([
    ['missing proofs', { state: 'ENABLED', publicId: null, displayName: '김자갈', summary: null }],
    [
      'flattened compatibility proof',
      {
        state: 'ENABLED',
        publicId: null,
        displayName: '김자갈',
        summary: null,
        proofs: [
          {
            missionId: 'mission-1',
            publicProofId: 'public-proof-1',
            title: 'flattened',
            isPublished: true,
          },
        ],
      },
    ],
    [
      'missing publication state',
      {
        state: 'ENABLED',
        publicId: null,
        displayName: '김자갈',
        summary: null,
        proofs: [
          {
            missionId: 'mission-1',
            validUntil: '2026-09-24T00:00:00.000Z',
            snapshot: {},
          },
        ],
      },
    ],
    [
      'malformed snapshot',
      {
        state: 'ENABLED',
        publicId: null,
        displayName: '김자갈',
        summary: null,
        proofs: [
          {
            missionId: 'mission-1',
            state: 'ACTIVE',
            validUntil: '2026-09-24T00:00:00.000Z',
            snapshot: { schemaVersion: 1 },
          },
        ],
      },
    ],
  ])('rejects a malformed owner profile: %s', async (_label, response) => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(response);
    await expect(getOwnerProofProfile()).rejects.toThrow('Invalid proof profile response');
  });
});
