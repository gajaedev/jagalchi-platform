'use client';

import { useId, useState, type FormEvent } from 'react';

import { BriefcaseBusiness } from 'lucide-react';

import type { CareerCompetency, CreateCareerTargetInput } from '@/api/career';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface CareerTargetFormProps {
  competencies: CareerCompetency[];
  isSubmitting: boolean;
  onSubmit: (input: CreateCareerTargetInput) => Promise<void>;
}

export function CareerTargetForm({ competencies, isSubmitting, onSubmit }: CareerTargetFormProps) {
  const formId = useId();
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [postingUrl, setPostingUrl] = useState('');
  const [requirements, setRequirements] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggleCompetency = (slug: string) => {
    setSelected((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (requirements.trim().length < 20) {
      setError('채용공고의 주요 업무와 자격 요건을 20자 이상 입력해주세요.');
      return;
    }
    if (selected.length === 0) {
      setError('채용공고에서 중요하게 보는 역량을 하나 이상 선택해주세요.');
      return;
    }
    try {
      await onSubmit({
        company: company.trim(),
        role: role.trim(),
        postingUrl: postingUrl.trim() || undefined,
        requirements: requirements.trim(),
        competencySlugs: selected,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '목표 직무를 저장하지 못했습니다.');
    }
  };

  return (
    <section className="border-border bg-card overflow-hidden rounded-3xl border">
      <div className="bg-primary-subtle border-border border-b px-5 py-6 sm:px-8 sm:py-8">
        <div className="text-primary flex size-11 items-center justify-center rounded-2xl bg-white/70 dark:bg-black/20">
          <BriefcaseBusiness aria-hidden="true" className="size-5" />
        </div>
        <p className="text-primary mt-5 text-xs font-extrabold">CAREER DIFF 시작하기</p>
        <h1 className="mt-2 max-w-2xl text-2xl font-extrabold tracking-tight sm:text-3xl">
          가고 싶은 회사와 지금 가진 증거의 차이를 확인하세요
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6">
          AI가 그럴듯한 점수를 만드는 대신, 채용공고의 요구 역량과 실제 결과물을 직접 연결합니다.
        </p>
      </div>

      <form className="space-y-7 px-5 py-6 sm:px-8 sm:py-8" onSubmit={handleSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2" htmlFor={`${formId}-company`}>
            <span className="text-sm font-bold">회사</span>
            <Input
              id={`${formId}-company`}
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="예: 토스"
              maxLength={100}
              required
            />
          </label>
          <label className="space-y-2" htmlFor={`${formId}-role`}>
            <span className="text-sm font-bold">목표 직무</span>
            <Input
              id={`${formId}-role`}
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="예: 프론트엔드 개발자"
              maxLength={120}
              required
            />
          </label>
        </div>

        <label className="block space-y-2" htmlFor={`${formId}-url`}>
          <span className="text-sm font-bold">채용공고 URL</span>
          <Input
            id={`${formId}-url`}
            type="url"
            value={postingUrl}
            onChange={(event) => setPostingUrl(event.target.value)}
            placeholder="https://..."
            maxLength={2_048}
          />
        </label>

        <label className="block space-y-2" htmlFor={`${formId}-requirements`}>
          <span className="text-sm font-bold">주요 업무와 자격 요건</span>
          <Textarea
            id={`${formId}-requirements`}
            value={requirements}
            onChange={(event) => setRequirements(event.target.value)}
            placeholder="채용공고에서 요구하는 기술, 경험, 협업 방식을 붙여 넣으세요."
            maxLength={20_000}
            textareaSize="lg"
            required
          />
        </label>

        <fieldset>
          <legend className="text-sm font-bold">공고에서 요구하는 핵심 역량</legend>
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            저장 시 공고 문구에서 발견한 역량도 함께 보완합니다.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {competencies.map((competency) => {
              const checked = selected.includes(competency.slug);
              return (
                <label
                  key={competency.slug}
                  className={cn(
                    'border-border bg-background hover:border-primary/50 flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                    checked && 'border-primary bg-primary-subtle',
                  )}
                >
                  <input
                    className="accent-primary mt-0.5 size-5 shrink-0"
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCompetency(competency.slug)}
                  />
                  <span>
                    <span className="block text-sm font-bold">{competency.label}</span>
                    <span className="text-muted-foreground mt-1 block text-xs leading-5">
                      {competency.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {error ? (
          <p className="text-error text-sm font-semibold" role="alert">
            {error}
          </p>
        ) : null}

        <Button className="w-full sm:w-auto" loading={isSubmitting} type="submit" size="lg">
          Career Diff 만들기
        </Button>
      </form>
    </section>
  );
}
