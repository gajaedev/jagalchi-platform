import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { runAiJob } from '@/api/ai-jobs';

import { LearningCoachModal } from '.';

vi.mock('@/api/ai-jobs', () => ({ runAiJob: vi.fn() }));

const roadmapId = '11111111-1111-4111-8111-111111111111';

describe('LearningCoachModal', () => {
  beforeEach(() => {
    vi.mocked(runAiJob).mockReset();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it('requests feedback through the typed AI jobs adapter', async () => {
    vi.mocked(runAiJob).mockResolvedValue({
      record_id: 'record-1',
      model_version: 'fixture',
      prompt_version: 'v1',
      created_at: '',
      scores: {
        evidence_level: 1,
        structure_score: 1,
        specificity_score: 1,
        reproducibility_score: 1,
        quality_score: 1,
      },
      strengths: [],
      gaps: [],
      rewrite_suggestions: { portfolio_bullets: [], improved_memo: '' },
      code_feedback: {},
      next_actions: [],
      followup_questions: [],
      retrieval_evidence: [],
    });
    const user = userEvent.setup();
    render(
      <LearningCoachModal isOpen onClose={vi.fn()} roadmapId={roadmapId} selectedNodeId="node-1" />,
    );

    await user.click(screen.getByRole('button', { name: '피드백 받기' }));

    expect(runAiJob).toHaveBeenCalledWith(
      'feedback',
      { node_id: 'node-1', compose_level: 'quick' },
      roadmapId,
    );
  });

  it('asks the coach through the typed AI jobs adapter', async () => {
    vi.mocked(runAiJob).mockResolvedValue({
      user_id: 'user-1',
      question: '다음 행동은?',
      intent: 'next-action',
      toolchain: [],
      plan: [],
      answer: '테스트를 추가하세요.',
      retrieval_evidence: [],
      behavior_summary: { motivation: 1, ability: 1, prompt_hour: 1, dropout_risk: 0 },
      model_version: 'fixture',
      prompt_version: 'v1',
      created_at: '',
      cache_hit: false,
    });
    const user = userEvent.setup();
    render(<LearningCoachModal isOpen onClose={vi.fn()} roadmapId={roadmapId} />);

    await user.click(screen.getByRole('button', { name: '질문하기' }));
    await user.type(
      screen.getByPlaceholderText('실행 단계에 관한 질문을 입력하세요'),
      '다음 행동은?',
    );
    await user.click(screen.getByRole('button', { name: '질문' }));

    expect(runAiJob).toHaveBeenCalledWith(
      'coaching',
      { question: '다음 행동은?', compose_level: 'quick' },
      roadmapId,
    );
  });
});
