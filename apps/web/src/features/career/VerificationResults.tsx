'use client';

import { AlertTriangle, CheckCircle2, CircleX, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { ProofMissionState } from './ProofMissionPanel';

export type VerificationCriterionResult = Readonly<{
  criterionId: string;
  label: string;
  type: 'MERGED_PR' | 'BASE_BRANCH' | 'CHANGED_PATH' | 'NAMED_CHECK' | 'HUMAN_CHECK';
  status: 'PASS' | 'FAIL' | 'ERROR';
  message?: string;
}>;

export interface VerificationRunView {
  id: string;
  status: 'PASS' | 'FAIL' | 'ERROR';
  observedAt: string;
  isStale: boolean;
  results: ReadonlyArray<VerificationCriterionResult>;
}

export interface VerificationResultsProps {
  run: VerificationRunView | null;
  missionState: ProofMissionState;
  onRefresh: () => void;
  isRefreshing: boolean;
  isLoading?: boolean;
  error?: string | null;
}

const RESULT_META = {
  PASS: {
    label: '통과',
    icon: CheckCircle2,
    className: 'text-success',
    surface: 'bg-success-subtle',
  },
  FAIL: { label: '불통과', icon: CircleX, className: 'text-error', surface: 'bg-error-subtle' },
  ERROR: {
    label: '확인 오류',
    icon: AlertTriangle,
    className: 'text-warning',
    surface: 'bg-warning-subtle',
  },
} as const;

export function VerificationResults({
  run,
  missionState,
  onRefresh,
  isRefreshing,
  isLoading = false,
  error,
}: VerificationResultsProps) {
  const archived = missionState === 'ARCHIVED';

  return (
    <section
      aria-labelledby="verification-results-heading"
      className="border-border bg-card rounded-3xl border p-5 sm:p-7"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-primary text-xs font-extrabold">IMMUTABLE RESULT</p>
          <h2 id="verification-results-heading" className="mt-2 text-xl font-extrabold">
            기준별 검증 결과
          </h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            각 실행은 관찰 당시 결과로 보존됩니다. 새로고침은 기존 결과를 바꾸지 않고 새 실행을
            만듭니다.
          </p>
        </div>
        <Button variant="outline" onClick={onRefresh} loading={isRefreshing} disabled={archived}>
          <RefreshCw aria-hidden="true" /> 직접 새로고침
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-6 flex min-h-36 items-center justify-center" role="status">
          <p className="text-muted-foreground text-sm">검증 결과를 불러오는 중입니다.</p>
        </div>
      ) : error ? (
        <div className="border-error/30 bg-error-subtle mt-6 rounded-2xl border p-4" role="alert">
          <p className="text-error text-sm font-bold">{error}</p>
        </div>
      ) : !run ? (
        <div className="border-border mt-6 rounded-2xl border border-dashed p-6 text-center">
          <p className="text-sm font-extrabold">아직 검증 결과가 없습니다.</p>
          <p className="text-muted-foreground mt-2 text-xs leading-5">
            PR을 연결하고 직접 새로고침하면 GitHub의 현재 사실을 확인합니다.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <div
            className={cn(
              'rounded-2xl p-4',
              run.isStale ? 'bg-warning-subtle' : RESULT_META[run.status].surface,
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p
                className={cn(
                  'flex items-center gap-2 text-sm font-extrabold',
                  run.isStale ? 'text-warning' : RESULT_META[run.status].className,
                )}
              >
                {run.isStale ? (
                  <AlertTriangle aria-hidden="true" className="size-4" />
                ) : (
                  (() => {
                    const Icon = RESULT_META[run.status].icon;
                    return <Icon aria-hidden="true" className="size-4" />;
                  })()
                )}
                {run.isStale ? '최신 상태 아님' : `전체 ${RESULT_META[run.status].label}`}
              </p>
              <p className="text-muted-foreground text-xs">
                관찰 시각{' '}
                <time dateTime={run.observedAt}>
                  {new Intl.DateTimeFormat('ko-KR', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(run.observedAt))}
                </time>
              </p>
            </div>
            {run.isStale ? (
              <p className="text-muted-foreground mt-2 text-xs leading-5">
                PR 또는 관련 상태가 바뀌었습니다. 이 결과와 이전 승인은 현재 증거로 사용할 수
                없습니다.
              </p>
            ) : null}
          </div>

          {run.results.length === 0 ? (
            <p className="text-muted-foreground mt-4 rounded-2xl border border-dashed p-4 text-sm">
              이 실행에 표시할 기준 결과가 없습니다.
            </p>
          ) : (
            <ol className="mt-4 space-y-3">
              {run.results.map((result, index) => {
                const meta = RESULT_META[result.status];
                const Icon = meta.icon;
                return (
                  <li
                    key={result.criterionId}
                    className="border-border bg-background flex items-start gap-3 rounded-2xl border p-4"
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl',
                        meta.surface,
                        meta.className,
                      )}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-extrabold">
                          {index + 1}. {result.label}
                        </p>
                        <span className={cn('text-xs font-bold', meta.className)}>
                          {meta.label}
                        </span>
                      </div>
                      {result.message ? (
                        <p className="text-muted-foreground mt-1 text-xs leading-5">
                          {result.message}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
