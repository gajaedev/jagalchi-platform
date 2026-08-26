'use client';

import { Archive, CheckCircle2, Clock3, GitBranch, RefreshCw, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ProofMissionState =
  'DRAFT' | 'BOUND' | 'REVIEW_PENDING' | 'APPROVED' | 'RETURNED' | 'ARCHIVED';

export interface ProofMissionPanelMission {
  id: string;
  objective: string;
  state: ProofMissionState;
  criteriaCount: number;
  isGithubBound: boolean;
  currentRunStatus: 'PASS' | 'FAIL' | 'ERROR' | null;
  isStale: boolean;
}

export interface ProofMissionPanelProps {
  mission: ProofMissionPanelMission;
  competency: { slug: string; label: string };
  onEditCriteria: () => void;
  onConnectGithub: () => void;
  onBind: () => void;
  onRefresh: () => void;
  onSubmit: () => void;
  isRefreshing: boolean;
  isSubmitting: boolean;
}

const STATE_META: Record<ProofMissionState, { label: string; className: string }> = {
  DRAFT: { label: '작성 중', className: 'bg-muted text-muted-foreground' },
  BOUND: { label: '검증 준비', className: 'bg-primary-subtle text-primary' },
  REVIEW_PENDING: { label: '검토 중', className: 'bg-warning-subtle text-warning' },
  APPROVED: { label: '승인됨', className: 'bg-success-subtle text-success' },
  RETURNED: { label: '수정 필요', className: 'bg-error-subtle text-error' },
  ARCHIVED: { label: '보관됨', className: 'bg-muted text-muted-foreground' },
};

export function ProofMissionPanel({
  mission,
  competency,
  onEditCriteria,
  onConnectGithub,
  onBind,
  onRefresh,
  onSubmit,
  isRefreshing,
  isSubmitting,
}: ProofMissionPanelProps) {
  const state = STATE_META[mission.state];
  const archived = mission.state === 'ARCHIVED';
  const canEditCriteria =
    mission.state === 'DRAFT' || mission.state === 'BOUND' || mission.state === 'RETURNED';
  const canSubmit =
    !archived &&
    mission.state !== 'REVIEW_PENDING' &&
    mission.currentRunStatus === 'PASS' &&
    !mission.isStale;

  return (
    <section
      aria-labelledby={`proof-mission-${mission.id}`}
      className="border-border bg-card rounded-3xl border p-5 sm:p-7"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-primary text-xs font-extrabold">PROOF MISSION</p>
          <h2
            id={`proof-mission-${mission.id}`}
            className="mt-2 text-xl font-extrabold sm:text-2xl"
          >
            {mission.objective}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            목표 역량: <strong className="text-foreground">{competency.label}</strong>
          </p>
        </div>
        <span
          className={cn(
            'inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold',
            state.className,
          )}
        >
          {mission.state === 'APPROVED' ? (
            <CheckCircle2 aria-hidden="true" className="size-3.5" />
          ) : mission.state === 'ARCHIVED' ? (
            <Archive aria-hidden="true" className="size-3.5" />
          ) : (
            <Clock3 aria-hidden="true" className="size-3.5" />
          )}
          {state.label}
        </span>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3">
        <div className="bg-muted/60 rounded-2xl p-4">
          <dt className="text-muted-foreground text-xs font-bold">검증 기준</dt>
          <dd className="mt-1 text-lg font-black">{mission.criteriaCount}개</dd>
        </div>
        <div className="bg-muted/60 rounded-2xl p-4">
          <dt className="text-muted-foreground text-xs font-bold">GitHub 연결</dt>
          <dd className="mt-1 text-sm font-extrabold">
            {mission.isGithubBound ? 'PR 연결됨' : '연결 필요'}
          </dd>
        </div>
      </dl>

      {mission.isStale ? (
        <div
          className="border-warning/30 bg-warning-subtle mt-4 rounded-2xl border p-4"
          role="status"
        >
          <p className="text-warning text-sm font-extrabold">
            이전 검증이 더 이상 최신이 아닙니다.
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            변경된 PR 상태를 직접 새로고침한 뒤 다시 검토를 요청해야 합니다.
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Button
          variant="outline"
          intent="neutral"
          onClick={onEditCriteria}
          disabled={!canEditCriteria}
        >
          기준 편집
        </Button>
        {!mission.isGithubBound ? (
          <Button variant="outline" onClick={onConnectGithub} disabled={archived}>
            <GitBranch aria-hidden="true" /> GitHub 연결
          </Button>
        ) : (
          <Button variant="outline" onClick={onBind} disabled={archived}>
            PR 변경
          </Button>
        )}
        <Button variant="outline" onClick={onRefresh} loading={isRefreshing} disabled={archived}>
          <RefreshCw aria-hidden="true" /> 직접 검증
        </Button>
        <Button onClick={onSubmit} loading={isSubmitting} disabled={!canSubmit}>
          <ShieldCheck aria-hidden="true" /> 검토 요청
        </Button>
      </div>
      {!canSubmit && !archived && mission.state !== 'REVIEW_PENDING' ? (
        <p className="text-muted-foreground mt-3 text-xs" role="status">
          통과한 최신 검증 결과가 있어야 검토를 요청할 수 있습니다.
        </p>
      ) : null}
    </section>
  );
}
