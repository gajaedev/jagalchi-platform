'use client';

import { useId, useState, type FormEvent } from 'react';

import { EyeOff, Globe2, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface ProofProfileSafePreview {
  publicProofId: string;
  title: string;
  summary: string | null;
  competencyLabel: string;
  contributionSummary: string | null;
  verifiedAt: string;
  criteria: {
    passedCount: number;
    totalCount: number;
    types: Array<'MERGED_PR' | 'BASE_BRANCH' | 'CHANGED_PATH' | 'NAMED_CHECK' | 'HUMAN_CHECK'>;
  };
  publicationState: 'ACTIVE' | 'UNPUBLISHED' | 'INVALIDATED';
  validUntil: string;
  isPublished: boolean;
}

export interface ProofProfileSettingsView {
  state: 'DISABLED' | 'ENABLED';
  publicId: string | null;
  displayName: string;
  summary: string;
  proofs: ProofProfileSafePreview[];
}

export interface ProofProfileSettingsProps {
  profile: ProofProfileSettingsView;
  onSaveProfile: (input: { displayName: string; summary: string | null }) => Promise<void> | void;
  onEnableProfile: () => Promise<void> | void;
  onDisableProfile: () => Promise<void> | void;
  onSetProofPublished: (publicProofId: string, published: boolean) => Promise<void> | void;
  onRenewProof: (publicProofId: string) => Promise<void> | void;
  isSaving: boolean;
  isEnabling: boolean;
  isDisabling: boolean;
  updatingProofId?: string | null;
  renewingProofId?: string | null;
  error?: string | null;
}

const CRITERION_LABELS: Record<ProofProfileSafePreview['criteria']['types'][number], string> = {
  MERGED_PR: 'PR 병합',
  BASE_BRANCH: '기준 브랜치',
  CHANGED_PATH: '변경 경로',
  NAMED_CHECK: '자동 검사',
  HUMAN_CHECK: '사람 검토',
};

export function ProofProfileSettings({
  profile,
  onSaveProfile,
  onEnableProfile,
  onDisableProfile,
  onSetProofPublished,
  onRenewProof,
  isSaving,
  isEnabling,
  isDisabling,
  updatingProofId,
  renewingProofId,
  error,
}: ProofProfileSettingsProps) {
  const draftKey = `${profile.displayName}\u0000${profile.summary}`;

  return (
    <ProofProfileSettingsDraft
      key={draftKey}
      profile={profile}
      onSaveProfile={onSaveProfile}
      onEnableProfile={onEnableProfile}
      onDisableProfile={onDisableProfile}
      onSetProofPublished={onSetProofPublished}
      onRenewProof={onRenewProof}
      isSaving={isSaving}
      isEnabling={isEnabling}
      isDisabling={isDisabling}
      updatingProofId={updatingProofId}
      renewingProofId={renewingProofId}
      error={error}
    />
  );
}

function ProofProfileSettingsDraft({
  profile,
  onSaveProfile,
  onEnableProfile,
  onDisableProfile,
  onSetProofPublished,
  onRenewProof,
  isSaving,
  isEnabling,
  isDisabling,
  updatingProofId,
  renewingProofId,
  error,
}: ProofProfileSettingsProps) {
  const formId = useId();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [summary, setSummary] = useState(profile.summary);
  const [localError, setLocalError] = useState<string | null>(null);
  const [renderedAt] = useState(Date.now);
  const enabled = profile.state === 'ENABLED';

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    if (!displayName.trim()) {
      setLocalError('공개 표시 이름을 입력해주세요.');
      return;
    }
    try {
      await onSaveProfile({ displayName: displayName.trim(), summary: summary.trim() || null });
    } catch (reason) {
      setLocalError(
        reason instanceof Error ? reason.message : '프로필 설정을 저장하지 못했습니다.',
      );
    }
  };

  const handleRenew = async (publicProofId: string) => {
    setLocalError(null);
    try {
      await onRenewProof(publicProofId);
    } catch (reason) {
      setLocalError(reason instanceof Error ? reason.message : '공개 기한을 갱신하지 못했습니다.');
    }
  };

  return (
    <section
      aria-labelledby={`${formId}-heading`}
      className="border-border bg-card rounded-3xl border p-5 sm:p-7"
    >
      <div className="flex items-start gap-3">
        <span className="bg-primary-subtle text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl">
          <Globe2 aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 id={`${formId}-heading`} className="text-xl font-extrabold">
            Proof Profile 공개 설정
          </h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            기본은 비공개입니다. 직접 켜고 증거별로 공개해야 하며, 검색엔진에 노출되지 않도록
            noindex 처리됩니다.
          </p>
        </div>
      </div>

      <div className="border-border bg-muted/50 mt-5 rounded-2xl border p-4">
        <div className="flex items-start gap-3">
          <EyeOff aria-hidden="true" className="text-muted-foreground mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-extrabold">비공개 우선 · 즉시 게시 해제</p>
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              프로필을 끄거나 증거 게시를 해제하면 공개 페이지에서 즉시 사라집니다. 링크를 아는
              사람만 접근할 수 있지만 비밀 링크를 보장하지는 않습니다.
            </p>
          </div>
        </div>
      </div>

      {error || localError ? (
        <p className="text-error mt-4 text-sm font-semibold" role="alert">
          {localError ?? error}
        </p>
      ) : null}

      <form className="mt-6" onSubmit={handleSave}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2" htmlFor={`${formId}-display-name`}>
            <span className="text-sm font-bold">공개 표시 이름</span>
            <Input
              id={`${formId}-display-name`}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={80}
              required
            />
          </label>
          <label className="block space-y-2 sm:col-span-2" htmlFor={`${formId}-summary`}>
            <span className="text-sm font-bold">공개 소개</span>
            <Textarea
              id={`${formId}-summary`}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              maxLength={500}
              placeholder="검증된 작업을 소개하는 짧은 설명"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          {enabled ? (
            <Button
              type="button"
              variant="outline"
              intent="destructive"
              onClick={onDisableProfile}
              loading={isDisabling}
            >
              프로필 즉시 끄기
            </Button>
          ) : (
            <Button type="button" onClick={onEnableProfile} loading={isEnabling}>
              <ShieldCheck aria-hidden="true" /> 공개 프로필 켜기
            </Button>
          )}
          <Button type="submit" variant="outline" loading={isSaving}>
            표시 정보 저장
          </Button>
        </div>
      </form>

      <div className="mt-8">
        <h3 className="text-base font-extrabold">증거별 공개</h3>
        <p className="text-muted-foreground mt-1 text-xs leading-5">
          공개 미리보기에는 아래 정보만 표시됩니다. 저장소·PR·브랜치·경로 패턴·검사 이름·리뷰어·채용
          정보는 공개하지 않습니다.
        </p>

        {profile.proofs.length === 0 ? (
          <div className="border-border mt-4 rounded-2xl border border-dashed p-6 text-center">
            <p className="text-sm font-extrabold">공개할 수 있는 승인된 증거가 없습니다.</p>
            <p className="text-muted-foreground mt-1 text-xs">
              최신 검증과 비자기 검토 승인이 완료된 증거만 여기에 나타납니다.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {profile.proofs.map((proof) => {
              const leaseElapsed = new Date(proof.validUntil).getTime() <= renderedAt;
              const activeButElapsed = proof.publicationState === 'ACTIVE' && leaseElapsed;
              const unpublishedButElapsed =
                proof.publicationState === 'UNPUBLISHED' && leaseElapsed;
              return (
                <li
                  key={proof.publicProofId}
                  className="border-border bg-background rounded-2xl border p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold">{proof.title}</p>
                      <p className="text-primary mt-1 text-xs font-bold">{proof.competencyLabel}</p>
                      {proof.summary ? (
                        <p className="text-muted-foreground mt-2 text-xs leading-5">
                          {proof.summary}
                        </p>
                      ) : null}
                      {proof.contributionSummary ? (
                        <p className="text-muted-foreground mt-2 text-xs leading-5">
                          기여: {proof.contributionSummary}
                        </p>
                      ) : null}
                      <p className="text-success mt-3 text-xs font-bold">
                        검증 완료 ·{' '}
                        <time dateTime={proof.verifiedAt}>{proof.verifiedAt.slice(0, 10)}</time> ·
                        기준 {proof.criteria.passedCount}/{proof.criteria.totalCount}
                      </p>
                      {proof.publicationState === 'ACTIVE' ? (
                        <p
                          className={
                            activeButElapsed
                              ? 'text-error mt-2 text-xs font-bold'
                              : 'text-muted-foreground mt-2 text-xs font-bold'
                          }
                        >
                          {activeButElapsed ? '공개 불가 · 공개 기한 만료' : '공개 중'} · 공개 기한{' '}
                          <time dateTime={proof.validUntil}>{proof.validUntil.slice(0, 10)}</time>
                        </p>
                      ) : proof.publicationState === 'INVALIDATED' ? (
                        <p className="text-error mt-2 text-xs font-bold">
                          검증 무효화 · 다시 검증하고 승인받아야 공개할 수 있습니다.
                        </p>
                      ) : (
                        <p
                          className={
                            unpublishedButElapsed
                              ? 'text-error mt-2 text-xs font-bold'
                              : 'text-muted-foreground mt-2 text-xs font-bold'
                          }
                        >
                          {unpublishedButElapsed
                            ? '게시되지 않음 · 공개 전에 기한 갱신 필요'
                            : '게시되지 않음'}
                        </p>
                      )}
                      <div
                        className="mt-3 flex flex-wrap gap-1.5"
                        aria-label={`통과 기준 ${proof.criteria.passedCount}개 중 ${proof.criteria.totalCount}개`}
                      >
                        {proof.criteria.types.map((type, index) => (
                          <span
                            key={`${type}-${index}`}
                            className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-[11px] font-bold"
                          >
                            {CRITERION_LABELS[type]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto">
                      {proof.publicationState === 'ACTIVE' ? (
                        <>
                          <Button
                            className="w-full sm:w-auto"
                            size="sm"
                            loading={renewingProofId === proof.publicProofId}
                            onClick={() => void handleRenew(proof.publicProofId)}
                          >
                            {activeButElapsed ? '검증 상태 확인 후 공개 갱신' : '공개 기한 갱신'}
                          </Button>
                          {proof.isPublished ? (
                            <Button
                              className="w-full sm:w-auto"
                              size="sm"
                              variant="outline"
                              intent="destructive"
                              loading={updatingProofId === proof.publicProofId}
                              onClick={() => void onSetProofPublished(proof.publicProofId, false)}
                            >
                              즉시 게시 해제
                            </Button>
                          ) : null}
                        </>
                      ) : proof.publicationState === 'UNPUBLISHED' ? (
                        <Button
                          className="w-full sm:w-auto"
                          size="sm"
                          disabled={!enabled}
                          loading={
                            unpublishedButElapsed
                              ? renewingProofId === proof.publicProofId
                              : updatingProofId === proof.publicProofId
                          }
                          onClick={() =>
                            void (unpublishedButElapsed
                              ? handleRenew(proof.publicProofId)
                              : onSetProofPublished(proof.publicProofId, true))
                          }
                        >
                          {unpublishedButElapsed ? '공개 기한 먼저 갱신' : '이 증거 공개'}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
