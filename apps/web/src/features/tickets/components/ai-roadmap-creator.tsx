'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAtomValue } from 'jotai';
import { Sparkles } from 'lucide-react';

import { persistGeneratedRoadmap, runAiJob } from '@/api/ai-jobs';
import { Button } from '@/components/ui/button';
import { isAuthenticatedAtom } from '@/lib/auth-atoms';

import { TICKET_COSTS } from '../ticket-policy';

export function AiRoadmapCreator() {
  const router = useRouter();
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const [goal, setGoal] = useState('');
  const [preferredTags, setPreferredTags] = useState('');
  const [maxNodes, setMaxNodes] = useState(8);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!goal.trim() || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const generated = await runAiJob('roadmap_generation', {
        goal: goal.trim(),
        preferred_tags: preferredTags.trim(),
        max_nodes: maxNodes,
        compose_level: 'full',
      });
      const roadmap = await persistGeneratedRoadmap(generated);
      router.push(`/editor/${roadmap.id}`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'AI 로드맵을 만들지 못했습니다. 사용한 티켓은 자동 환급됩니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="border-border bg-card rounded-3xl border p-6 text-center sm:p-8">
        <Sparkles aria-hidden="true" className="text-ticket mx-auto size-8" />
        <h2 className="mt-4 text-xl font-extrabold">로그인하고 AI 로드맵을 만들어 보세요</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          신규 가입 시 무료 티켓 30장이 지급돼요.
        </p>
        <Link
          href="/login"
          className="bg-primary text-primary-foreground mt-6 inline-flex min-h-12 items-center justify-center rounded-xl px-6 text-sm font-bold"
        >
          로그인
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="border-border bg-card rounded-3xl border p-6 shadow-sm sm:p-8"
    >
      <div>
        <label htmlFor="roadmap-goal" className="text-sm font-extrabold">
          학습 목표
        </label>
        <textarea
          id="roadmap-goal"
          required
          maxLength={1_000}
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          placeholder="예: 6개월 안에 Expo로 iOS·Android 앱을 출시하고 싶어요."
          className="border-border bg-background focus-visible:ring-ring mt-2 min-h-32 w-full resize-y rounded-xl border p-4 text-sm leading-6 outline-none focus-visible:ring-2"
        />
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="preferred-tags" className="text-sm font-extrabold">
            관심 기술
          </label>
          <input
            id="preferred-tags"
            value={preferredTags}
            onChange={(event) => setPreferredTags(event.target.value)}
            placeholder="Expo, TypeScript"
            className="border-border bg-background focus-visible:ring-ring mt-2 min-h-12 w-full rounded-xl border px-4 text-sm outline-none focus-visible:ring-2"
          />
        </div>
        <div>
          <label htmlFor="max-nodes" className="text-sm font-extrabold">
            학습 단계 수
          </label>
          <select
            id="max-nodes"
            value={maxNodes}
            onChange={(event) => setMaxNodes(Number(event.target.value))}
            className="border-border bg-background focus-visible:ring-ring mt-2 min-h-12 w-full rounded-xl border px-4 text-sm outline-none focus-visible:ring-2"
          >
            <option value={6}>6단계</option>
            <option value={8}>8단계</option>
            <option value={10}>10단계</option>
            <option value={12}>12단계</option>
          </select>
        </div>
      </div>

      {error ? (
        <p role="alert" className="bg-error-subtle text-error mt-5 rounded-xl p-4 text-sm">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={!goal.trim() || isSubmitting}
        intent="ticket"
        size="lg"
        loading={isSubmitting}
        loadingLabel="AI가 로드맵을 설계하는 중…"
        className="mt-6 w-full"
      >
        <Sparkles aria-hidden="true" className="size-4" />
        {`AI 로드맵 만들기 · ${TICKET_COSTS.roadmap_generation}장`}
      </Button>
      <p className="text-muted-foreground mt-3 text-center text-xs leading-5">
        생성에 실패하면 예약된 티켓은 자동으로 환급돼요.
      </p>
    </form>
  );
}
