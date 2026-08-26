'use client';

import { useId, useState, type FormEvent } from 'react';

import { Link2 } from 'lucide-react';

import type { CareerCompetency, CareerEvidenceKind, CreateCareerEvidenceInput } from '@/api/career';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const EVIDENCE_KINDS: Array<{ value: CareerEvidenceKind; label: string }> = [
  { value: 'GITHUB_PULL_REQUEST', label: 'GitHub PR' },
  { value: 'GITHUB_REPOSITORY', label: 'GitHub 저장소' },
  { value: 'DEPLOYMENT', label: '배포 결과물' },
  { value: 'ARTICLE', label: '기술 문서·블로그' },
  { value: 'OTHER', label: '기타 증거' },
];

interface CareerEvidenceFormProps {
  competencies: CareerCompetency[];
  isSubmitting: boolean;
  onSubmit: (input: CreateCareerEvidenceInput) => Promise<void>;
}

export function CareerEvidenceForm({
  competencies,
  isSubmitting,
  onSubmit,
}: CareerEvidenceFormProps) {
  const formId = useId();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [kind, setKind] = useState<CareerEvidenceKind>('GITHUB_PULL_REQUEST');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const toggleCompetency = (slug: string) => {
    setSelected((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitted(false);
    if (!url.startsWith('https://')) {
      setError('검증 가능한 HTTPS 주소를 입력해주세요.');
      return;
    }
    if (selected.length === 0) {
      setError('이 결과물이 증명하는 역량을 하나 이상 선택해주세요.');
      return;
    }
    try {
      await onSubmit({
        title: title.trim(),
        url: url.trim(),
        kind,
        description: description.trim() || undefined,
        competencySlugs: selected,
      });
      setTitle('');
      setUrl('');
      setDescription('');
      setSelected([]);
      setSubmitted(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '증거를 제출하지 못했습니다.');
    }
  };

  return (
    <form className="border-border bg-card rounded-2xl border p-5 sm:p-6" onSubmit={handleSubmit}>
      <div className="flex items-start gap-3">
        <span className="bg-primary-subtle text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Link2 aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-extrabold">결과물 증거 제출</h2>
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            제출만으로 검증되지 않습니다. 리뷰가 끝나면 준비도에 반영됩니다.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <label className="block space-y-2" htmlFor={`${formId}-title`}>
          <span className="text-sm font-bold">결과물 이름</span>
          <Input
            id={`${formId}-title`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: 상품 목록 렌더링 성능 개선 PR"
            maxLength={160}
            required
          />
        </label>

        <label className="block space-y-2" htmlFor={`${formId}-kind`}>
          <span className="text-sm font-bold">증거 유형</span>
          <select
            id={`${formId}-kind`}
            value={kind}
            onChange={(event) => setKind(event.target.value as CareerEvidenceKind)}
            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/40 h-11 w-full rounded-xl border px-3.5 text-sm outline-none focus-visible:ring-3"
          >
            {EVIDENCE_KINDS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2" htmlFor={`${formId}-url`}>
          <span className="text-sm font-bold">공개 URL</span>
          <Input
            id={`${formId}-url`}
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://github.com/..."
            maxLength={2_048}
            required
          />
        </label>

        <label className="block space-y-2" htmlFor={`${formId}-description`}>
          <span className="text-sm font-bold">내가 해결한 문제</span>
          <Textarea
            id={`${formId}-description`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="문제, 선택한 접근, 측정된 결과를 간단히 적어주세요."
            maxLength={1_000}
          />
        </label>

        <fieldset>
          <legend className="text-sm font-bold">이 결과물이 증명하는 역량</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {competencies.map((competency) => {
              const checked = selected.includes(competency.slug);
              return (
                <label
                  key={competency.slug}
                  className={cn(
                    'border-border bg-background hover:border-primary/50 flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition-colors',
                    checked && 'border-primary bg-primary-subtle text-primary',
                  )}
                >
                  <input
                    className="accent-primary size-4"
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCompetency(competency.slug)}
                  />
                  {competency.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      {error ? (
        <p className="text-error mt-4 text-sm font-semibold" role="alert">
          {error}
        </p>
      ) : null}
      {submitted ? (
        <p className="text-success mt-4 text-sm font-semibold" role="status">
          증거를 제출했습니다. 검토 전까지 ‘검토 중’으로 표시됩니다.
        </p>
      ) : null}

      <Button className="mt-5 w-full" loading={isSubmitting} type="submit">
        검증 요청하기
      </Button>
    </form>
  );
}
