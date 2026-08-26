'use client';

import { useId, useState, type FormEvent } from 'react';

import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type ProofCriterion =
  | { id?: string; type: 'MERGED_PR' }
  | { id?: string; type: 'BASE_BRANCH'; branch: string }
  | { id?: string; type: 'CHANGED_PATH'; pathGlob: string }
  | { id?: string; type: 'NAMED_CHECK'; checkName: string }
  | { id?: string; type: 'HUMAN_CHECK'; description: string };

export interface ProofCriteriaEditorProps {
  criteria: ProofCriterion[];
  disabled: boolean;
  onSave: (criteria: ProofCriterion[]) => Promise<void> | void;
  isSaving: boolean;
}

const TYPES: Array<{ value: ProofCriterion['type']; label: string }> = [
  { value: 'MERGED_PR', label: 'PR 병합 완료' },
  { value: 'BASE_BRANCH', label: '기준 브랜치 일치' },
  { value: 'CHANGED_PATH', label: '변경 경로 포함' },
  { value: 'NAMED_CHECK', label: '필수 검사 통과' },
  { value: 'HUMAN_CHECK', label: '사람이 확인할 항목' },
];

function newCriterion(type: ProofCriterion['type']): ProofCriterion {
  switch (type) {
    case 'BASE_BRANCH':
      return { type, branch: '' };
    case 'CHANGED_PATH':
      return { type, pathGlob: '' };
    case 'NAMED_CHECK':
      return { type, checkName: '' };
    case 'HUMAN_CHECK':
      return { type, description: '' };
    default:
      return { type: 'MERGED_PR' };
  }
}

function criterionValue(criterion: ProofCriterion): string {
  switch (criterion.type) {
    case 'BASE_BRANCH':
      return criterion.branch;
    case 'CHANGED_PATH':
      return criterion.pathGlob;
    case 'NAMED_CHECK':
      return criterion.checkName;
    case 'HUMAN_CHECK':
      return criterion.description;
    default:
      return '';
  }
}

function criterionWithValue(criterion: ProofCriterion, value: string): ProofCriterion {
  switch (criterion.type) {
    case 'BASE_BRANCH':
      return { ...criterion, branch: value };
    case 'CHANGED_PATH':
      return { ...criterion, pathGlob: value };
    case 'NAMED_CHECK':
      return { ...criterion, checkName: value };
    case 'HUMAN_CHECK':
      return { ...criterion, description: value };
    default:
      return criterion;
  }
}

const VALUE_LABELS: Partial<Record<ProofCriterion['type'], string>> = {
  BASE_BRANCH: '정확한 기준 브랜치',
  CHANGED_PATH: '허용된 변경 경로 패턴',
  NAMED_CHECK: '필수 검사 이름',
  HUMAN_CHECK: '리뷰어 확인 항목',
};

export function ProofCriteriaEditor({
  criteria,
  disabled,
  onSave,
  isSaving,
}: ProofCriteriaEditorProps) {
  const draftKey = JSON.stringify(criteria);

  return (
    <ProofCriteriaEditorDraft
      key={draftKey}
      criteria={criteria}
      disabled={disabled}
      onSave={onSave}
      isSaving={isSaving}
    />
  );
}

function ProofCriteriaEditorDraft({
  criteria,
  disabled,
  onSave,
  isSaving,
}: ProofCriteriaEditorProps) {
  const formId = useId();
  const [draft, setDraft] = useState<ProofCriterion[]>(criteria);
  const [nextType, setNextType] = useState<ProofCriterion['type']>('MERGED_PR');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (draft.length < 1 || draft.length > 10) {
      setError('검증 기준은 1개 이상 10개 이하로 구성해주세요.');
      return;
    }
    if (draft.some((item) => item.type !== 'MERGED_PR' && !criterionValue(item).trim())) {
      setError('모든 검증 기준의 내용을 입력해주세요.');
      return;
    }
    try {
      await onSave(draft.map((item) => criterionWithValue(item, criterionValue(item).trim())));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '검증 기준을 저장하지 못했습니다.');
    }
  };

  return (
    <form className="border-border bg-card rounded-3xl border p-5 sm:p-7" onSubmit={handleSubmit}>
      <fieldset disabled={disabled || isSaving}>
        <legend className="text-xl font-extrabold">검증 기준 편집</legend>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          GitHub에서 읽은 사실과 사람의 확인 항목만 사용합니다. 기준을 바꾸면 이전 검증과 승인은
          다시 사용할 수 없습니다.
        </p>

        <ol className="mt-6 space-y-3">
          {draft.map((criterion, index) => {
            const valueLabel = VALUE_LABELS[criterion.type];
            return (
              <li
                key={criterion.id ?? `${criterion.type}-${index}`}
                className="border-border bg-background rounded-2xl border p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-extrabold">
                    {index + 1}. {TYPES.find((item) => item.value === criterion.type)?.label}
                  </p>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    intent="destructive"
                    aria-label={`${index + 1}번 기준 삭제`}
                    onClick={() =>
                      setDraft((current) => current.filter((_, itemIndex) => itemIndex !== index))
                    }
                    disabled={draft.length === 1}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
                {valueLabel ? (
                  <label className="mt-3 block space-y-2" htmlFor={`${formId}-criterion-${index}`}>
                    <span className="text-xs font-bold">{valueLabel}</span>
                    <Input
                      id={`${formId}-criterion-${index}`}
                      value={criterionValue(criterion)}
                      maxLength={criterion.type === 'HUMAN_CHECK' ? 300 : 160}
                      onChange={(event) =>
                        setDraft((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? criterionWithValue(item, event.target.value)
                              : item,
                          ),
                        )
                      }
                      required
                    />
                  </label>
                ) : (
                  <p className="text-muted-foreground mt-2 text-xs">
                    연결한 PR의 병합 여부를 확인합니다.
                  </p>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label className="flex-1" htmlFor={`${formId}-new-type`}>
            <span className="sr-only">추가할 기준 유형</span>
            <select
              id={`${formId}-new-type`}
              value={nextType}
              onChange={(event) => setNextType(event.target.value as ProofCriterion['type'])}
              className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/40 h-11 w-full rounded-xl border px-3.5 text-sm outline-none focus-visible:ring-3"
            >
              {TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDraft((current) => [...current, newCriterion(nextType)])}
            disabled={draft.length >= 10}
          >
            <Plus aria-hidden="true" /> 기준 추가
          </Button>
        </div>
      </fieldset>

      {error ? (
        <p className="text-error mt-4 text-sm font-semibold" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-xs">{draft.length} / 10개</p>
        <Button type="submit" loading={isSaving} disabled={disabled}>
          기준 저장
        </Button>
      </div>
    </form>
  );
}
