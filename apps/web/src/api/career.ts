import { apiClient } from './client';

export type CareerCompetencyCategory = 'FOUNDATION' | 'FRONTEND' | 'ENGINEERING' | 'DELIVERY';
export type CareerDiffStatus = 'VERIFIED' | 'SUBMITTED' | 'MISSING';
export type CareerEvidenceKind =
  'GITHUB_PULL_REQUEST' | 'GITHUB_REPOSITORY' | 'DEPLOYMENT' | 'ARTICLE' | 'OTHER';
export type CareerEvidenceStatus = 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
export type ProofMissionState =
  'DRAFT' | 'BOUND' | 'REVIEW_PENDING' | 'APPROVED' | 'RETURNED' | 'ARCHIVED';
export type ProofCriterionType =
  'MERGED_PR' | 'BASE_BRANCH' | 'CHANGED_PATH' | 'NAMED_CHECK' | 'HUMAN_CHECK';
export type ProofVerificationStatus = 'PASS' | 'FAIL' | 'ERROR';
export type ProofReviewDecision = 'APPROVED' | 'RETURNED';

export type ProofCriterionConfig =
  | { type: 'MERGED_PR'; config: Record<string, never> }
  | { type: 'BASE_BRANCH'; config: { branch: string } }
  | { type: 'CHANGED_PATH'; config: { glob: string } }
  | { type: 'NAMED_CHECK'; config: { context: string } }
  | { type: 'HUMAN_CHECK'; config: { label: string } };

export interface ProofCriterion {
  id: string;
  position: number;
  type: ProofCriterionType;
  config: Record<string, string>;
}

export interface ProofCriterionResult {
  criterionId: string;
  position: number;
  type: ProofCriterionType;
  passed: boolean;
  detail: string | null;
}

export interface ProofVerificationRun {
  id: string;
  status: ProofVerificationStatus;
  headSha: string;
  observedAt: string;
  stale: boolean;
  criteria: ProofCriterionResult[];
}

export interface ProofReview {
  id: string;
  verificationRunId: string;
  decision: ProofReviewDecision;
  note: string | null;
  reviewedAt: string;
}

export interface ProofMission {
  id: string;
  targetId: string;
  competencySlug: string;
  competencyLabel: string;
  title: string;
  summary: string | null;
  state: ProofMissionState;
  criteriaVersion: number;
  bindingVersion: number;
  binding: {
    installationId: string;
    githubRepositoryId: string;
    pullNumber: number;
    repositoryName: string;
    repositoryPrivate: boolean;
    pullTitle: string;
    pullUrl: string;
  } | null;
  criteria: ProofCriterion[];
  currentVerificationRun: ProofVerificationRun | null;
  currentReview: ProofReview | null;
  createdAt: string;
  updatedAt: string;
}

export type ProofReviewCriterion =
  | {
      position: number;
      type: Exclude<ProofCriterionType, 'HUMAN_CHECK'>;
      config: Record<string, never>;
    }
  | {
      position: number;
      type: 'HUMAN_CHECK';
      config: { label: string };
    };

export interface ProofReviewCriterionResult {
  position: number;
  type: ProofCriterionType;
  passed: boolean;
  detail: string | null;
}

export interface ProofReviewQueueItem {
  id: string;
  targetId: string;
  title: string;
  summary: string | null;
  state: ProofMissionState;
  competencySlug: string;
  competencyLabel: string;
  ownerDisplayName: string;
  submittedAt: string;
  criteria: ProofReviewCriterion[];
  currentVerificationRun: {
    status: ProofVerificationStatus;
    observedAt: string;
    results: ProofReviewCriterionResult[];
  } | null;
}

export interface CareerCompetency {
  slug: string;
  label: string;
  category: CareerCompetencyCategory;
  description: string;
}

export interface CareerTarget {
  id: string;
  userId: string;
  company: string;
  role: string;
  postingUrl: string | null;
  requirements: string;
  competencySlugs: string[];
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface CareerEvidence {
  id: string;
  userId: string;
  title: string;
  url: string;
  kind: CareerEvidenceKind;
  description: string;
  competencySlugs: string[];
  status: CareerEvidenceStatus;
  reviewerId: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CareerReviewQueueItem {
  id: string;
  title: string;
  url: string;
  kind: CareerEvidenceKind;
  description: string;
  competencySlugs: string[];
  status: CareerEvidenceStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CareerDiff {
  target: CareerTarget;
  summary: {
    requiredCount: number;
    verifiedCount: number;
    submittedCount: number;
    missingCount: number;
    verifiedPercentage: number;
  };
  competencies: Array<
    CareerCompetency & {
      status: CareerDiffStatus;
      evidence: Array<
        Pick<CareerEvidence, 'id' | 'title' | 'url' | 'kind' | 'status' | 'reviewNote'>
      >;
    }
  >;
}

export interface CreateCareerTargetInput {
  company: string;
  role: string;
  postingUrl?: string;
  requirements: string;
  competencySlugs: string[];
}

export interface CreateCareerEvidenceInput {
  title: string;
  url: string;
  kind: CareerEvidenceKind;
  description?: string;
  competencySlugs: string[];
}

export interface CreateProofMissionInput {
  targetId: string;
  competencySlug: string;
  title: string;
  summary?: string;
  idempotencyKey: string;
}

export interface ReplaceProofCriteriaInput {
  criteria: ProofCriterionConfig[];
  idempotencyKey: string;
}

export interface BindProofMissionInput {
  installationId: string;
  githubRepositoryId: string;
  pullNumber: number;
  idempotencyKey: string;
}

export const listCareerCompetencies = () =>
  apiClient.get<CareerCompetency[]>('/career/competencies');

export const listCareerTargets = () => apiClient.get<CareerTarget[]>('/career/targets');

export const createCareerTarget = (input: CreateCareerTargetInput) =>
  apiClient.post<CareerTarget>('/career/targets', input);

export const getCareerDiff = (targetId: string) =>
  apiClient.get<CareerDiff>(`/career/targets/${targetId}/diff`);

export const listCareerEvidence = () => apiClient.get<CareerEvidence[]>('/career/evidence');

export const createCareerEvidence = (input: CreateCareerEvidenceInput) =>
  apiClient.post<CareerEvidence>('/career/evidence', input);

export const listCareerReviews = () => apiClient.get<CareerReviewQueueItem[]>('/career/reviews');

export const reviewCareerEvidence = (
  evidenceId: string,
  input: { status: 'VERIFIED' | 'REJECTED'; reviewNote?: string },
) => apiClient.patch<CareerReviewQueueItem>(`/career/evidence/${evidenceId}/review`, input);

export const listProofMissions = (targetId: string) =>
  apiClient.get<ProofMission[]>(`/career/proof-missions?targetId=${encodeURIComponent(targetId)}`);

export const getProofMission = (missionId: string) =>
  apiClient.get<ProofMission>(`/career/proof-missions/${missionId}`);

export const createProofMission = (input: CreateProofMissionInput) =>
  apiClient.post<ProofMission>('/career/proof-missions', input);

export const replaceProofCriteria = (missionId: string, input: ReplaceProofCriteriaInput) =>
  apiClient.put<ProofMission>(`/career/proof-missions/${missionId}/criteria`, input);

export const bindProofMission = (missionId: string, input: BindProofMissionInput) =>
  apiClient.post<ProofMission>(`/career/proof-missions/${missionId}/bind`, input);

export const refreshProofVerification = (missionId: string, idempotencyKey: string) =>
  apiClient.post<ProofMission>(`/career/proof-missions/${missionId}/refresh`, {
    idempotencyKey,
  });

export const submitProofMission = (missionId: string, idempotencyKey: string) =>
  apiClient.post<ProofMission>(`/career/proof-missions/${missionId}/submit`, {
    idempotencyKey,
  });

export const listProofReviews = () =>
  apiClient.get<ProofReviewQueueItem[]>('/career/proof-reviews');

export const reviewProofMission = (
  missionId: string,
  input: {
    decision: ProofReviewDecision;
    note?: string;
    idempotencyKey: string;
  },
) => apiClient.post<ProofReviewQueueItem>(`/career/proof-missions/${missionId}/review`, input);
