import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import {
  bindProofMission,
  createCareerEvidence,
  createProofMission,
  createCareerTarget,
  getCareerDiff,
  getProofMission,
  listCareerCompetencies,
  listCareerEvidence,
  listProofMissions,
  listProofReviews,
  listCareerReviews,
  listCareerTargets,
  refreshProofVerification,
  replaceProofCriteria,
  reviewProofMission,
  reviewCareerEvidence,
  submitProofMission,
  type BindProofMissionInput,
  type CreateCareerEvidenceInput,
  type CreateProofMissionInput,
  type CreateCareerTargetInput,
  type ProofMission,
  type ProofReviewDecision,
  type ReplaceProofCriteriaInput,
} from '@/api/career';
import {
  getOwnerProofProfile,
  publishOwnerProof,
  renewOwnerProof,
  unpublishOwnerProof,
  updateOwnerProofProfile,
  type OwnerProofProfile,
  type PublishOwnerProofInput,
  type RenewOwnerProofInput,
  type UpdateOwnerProofProfileInput,
} from '@/api/proof-profile';
import { isAuthenticatedAtom, isAuthInitializedAtom } from '@/lib/auth-atoms';
import { queryKeys } from '@/lib/query-keys';

const proofMissionKeys = {
  lists: () => [...queryKeys.career.all, 'proof-missions'] as const,
  list: (targetId: string) => [...proofMissionKeys.lists(), targetId] as const,
  details: () => [...queryKeys.career.all, 'proof-mission'] as const,
  detail: (missionId: string) => [...proofMissionKeys.details(), missionId] as const,
  reviews: () => [...queryKeys.career.all, 'proof-reviews'] as const,
};

const commandKey = () => crypto.randomUUID();

function useAuthenticatedQueryReady() {
  const initialized = useAtomValue(isAuthInitializedAtom);
  const authenticated = useAtomValue(isAuthenticatedAtom);
  return initialized && authenticated;
}

function setMissionData(queryClient: QueryClient, mission: ProofMission) {
  queryClient.setQueryData(proofMissionKeys.detail(mission.id), mission);
  queryClient.setQueryData<ProofMission[]>(proofMissionKeys.list(mission.targetId), (current) => {
    if (!current) return current;
    const exists = current.some((item) => item.id === mission.id);
    return exists
      ? current.map((item) => (item.id === mission.id ? mission : item))
      : [mission, ...current];
  });
}

export function useCareerCompetencies() {
  const enabled = useAuthenticatedQueryReady();
  return useQuery({
    queryKey: queryKeys.career.competencies(),
    queryFn: listCareerCompetencies,
    staleTime: Number.POSITIVE_INFINITY,
    enabled,
  });
}

export function useCareerTargets() {
  const enabled = useAuthenticatedQueryReady();
  return useQuery({ queryKey: queryKeys.career.targets(), queryFn: listCareerTargets, enabled });
}

export function useCareerDiff(targetId: string | null) {
  const ready = useAuthenticatedQueryReady();
  return useQuery({
    queryKey: queryKeys.career.diff(targetId ?? 'none'),
    queryFn: () => getCareerDiff(targetId!),
    enabled: ready && Boolean(targetId),
  });
}

export function useCareerEvidence() {
  const enabled = useAuthenticatedQueryReady();
  return useQuery({ queryKey: queryKeys.career.evidence(), queryFn: listCareerEvidence, enabled });
}

export function useCreateCareerTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCareerTargetInput) => createCareerTarget(input),
    onSuccess: (target) => {
      queryClient.setQueryData(queryKeys.career.diff(target.id), undefined);
      return queryClient.invalidateQueries({ queryKey: queryKeys.career.targets() });
    },
  });
}

export function useCreateCareerEvidence(targetId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCareerEvidenceInput) => createCareerEvidence(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.career.evidence() });
      if (targetId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.career.diff(targetId) });
      }
    },
  });
}

export function useCareerReviews() {
  const enabled = useAuthenticatedQueryReady();
  return useQuery({ queryKey: queryKeys.career.reviews(), queryFn: listCareerReviews, enabled });
}

export function useReviewCareerEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      evidenceId,
      status,
      reviewNote,
    }: {
      evidenceId: string;
      status: 'VERIFIED' | 'REJECTED';
      reviewNote?: string;
    }) => reviewCareerEvidence(evidenceId, { status, reviewNote }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.career.reviews() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.career.evidence() }),
        queryClient.invalidateQueries({ queryKey: [...queryKeys.career.all, 'diff'] }),
      ]);
    },
  });
}

export function useProofMissions(targetId: string | null) {
  const ready = useAuthenticatedQueryReady();
  return useQuery({
    queryKey: proofMissionKeys.list(targetId ?? 'none'),
    queryFn: () => listProofMissions(targetId!),
    enabled: ready && Boolean(targetId),
  });
}

export function useProofMission(missionId: string | null) {
  const ready = useAuthenticatedQueryReady();
  return useQuery({
    queryKey: proofMissionKeys.detail(missionId ?? 'none'),
    queryFn: () => getProofMission(missionId!),
    enabled: ready && Boolean(missionId),
  });
}

export function useCreateProofMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CreateProofMissionInput, 'idempotencyKey'>) =>
      createProofMission({ ...input, idempotencyKey: commandKey() }),
    onSuccess: (mission) => setMissionData(queryClient, mission),
  });
}

export function useReplaceProofCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      missionId,
      criteria,
    }: {
      missionId: string;
      criteria: ReplaceProofCriteriaInput['criteria'];
    }) => replaceProofCriteria(missionId, { criteria, idempotencyKey: commandKey() }),
    onSuccess: async (mission) => {
      setMissionData(queryClient, mission);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.career.diff(mission.targetId),
      });
    },
  });
}

export function useBindProofMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      missionId,
      ...input
    }: Omit<BindProofMissionInput, 'idempotencyKey'> & { missionId: string }) =>
      bindProofMission(missionId, { ...input, idempotencyKey: commandKey() }),
    onSuccess: async (mission) => {
      setMissionData(queryClient, mission);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.career.diff(mission.targetId),
      });
    },
  });
}

export function useRefreshProofVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (missionId: string) => refreshProofVerification(missionId, commandKey()),
    onSuccess: async (mission) => {
      setMissionData(queryClient, mission);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.career.diff(mission.targetId),
      });
    },
  });
}

export function useSubmitProofMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (missionId: string) => submitProofMission(missionId, commandKey()),
    onSuccess: async (mission) => {
      setMissionData(queryClient, mission);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.career.diff(mission.targetId),
      });
    },
  });
}

export function useProofReviews() {
  const enabled = useAuthenticatedQueryReady();
  return useQuery({
    queryKey: proofMissionKeys.reviews(),
    queryFn: listProofReviews,
    enabled,
  });
}

export function useReviewProofMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      missionId,
      decision,
      note,
    }: {
      missionId: string;
      decision: ProofReviewDecision;
      note?: string;
    }) => reviewProofMission(missionId, { decision, note, idempotencyKey: commandKey() }),
    onSuccess: async (mission) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: proofMissionKeys.reviews() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.career.diff(mission.targetId) }),
      ]);
    },
  });
}

export function useOwnerProofProfile() {
  const enabled = useAuthenticatedQueryReady();
  return useQuery({
    queryKey: queryKeys.career.proofProfile(),
    queryFn: getOwnerProofProfile,
    enabled,
  });
}

export function useUpdateOwnerProofProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<UpdateOwnerProofProfileInput, 'idempotencyKey'>) =>
      updateOwnerProofProfile({ ...input, idempotencyKey: commandKey() }),
    onSuccess: async (profile) => {
      queryClient.setQueryData<OwnerProofProfile | null>(queryKeys.career.proofProfile(), profile);
      await queryClient.invalidateQueries({ queryKey: queryKeys.career.proofProfile() });
    },
  });
}

export function usePublishOwnerProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      missionId,
      ...input
    }: { missionId: string } & Omit<PublishOwnerProofInput, 'idempotencyKey'>) =>
      publishOwnerProof(missionId, { ...input, idempotencyKey: commandKey() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.career.proofProfile() }),
  });
}

export function useRenewOwnerProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      missionId,
      ...input
    }: { missionId: string } & Omit<RenewOwnerProofInput, 'idempotencyKey'>) =>
      renewOwnerProof(missionId, { ...input, idempotencyKey: commandKey() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.career.proofProfile() }),
  });
}

export function useUnpublishOwnerProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (missionId: string) => unpublishOwnerProof(missionId, commandKey()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.career.proofProfile() }),
  });
}
