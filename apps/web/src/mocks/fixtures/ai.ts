/**
 * Mock AI API fixture data for MSW handlers
 * AI 서비스 응답 데이터 (health, node-description, resource-recommendation 등)
 */

export const MOCK_AI_HEALTH = {
  status: 'ok',
  version: '1.0.0',
  services: {
    gemini: true,
    apify: true,
  },
  timestamp: '2026-04-14T00:00:00.000Z',
};

export const MOCK_NODE_DESCRIPTION = {
  node_title: 'React',
  description:
    'React는 사용자 인터페이스를 구축하기 위한 JavaScript 라이브러리입니다. 컴포넌트 기반 아키텍처와 가상 DOM을 활용하여 효율적인 UI 렌더링을 제공합니다.',
  generated_at: '2026-04-14T00:00:00.000Z',
};

export const MOCK_RESOURCE_RECOMMENDATIONS = {
  query: 'React',
  items: [
    {
      title: 'React 공식 문서',
      url: 'https://react.dev/',
      type: 'documentation',
      why_recommended:
        'React 팀이 직접 관리하는 공식 문서로, 최신 패턴과 API를 정확하게 설명합니다.',
      difficulty: 'beginner',
      estimated_minutes: 120,
    },
    {
      title: 'React로 사고하기',
      url: 'https://react.dev/learn/thinking-in-react',
      type: 'tutorial',
      why_recommended:
        'React의 핵심 멘탈 모델을 이해하는 데 필수적인 튜토리얼입니다. 컴포넌트 분해와 상태 설계를 단계별로 배울 수 있습니다.',
      difficulty: 'intermediate',
      estimated_minutes: 45,
    },
  ],
};

export const MOCK_TECH_CARD = {
  title: 'React',
  category: 'Frontend',
  summary:
    'React는 Meta에서 개발한 UI 라이브러리로, 컴포넌트 기반 개발과 가상 DOM을 핵심 특징으로 합니다.',
  pros: ['큰 커뮤니티와 생태계', '재사용 가능한 컴포넌트', '가상 DOM을 통한 성능 최적화'],
  cons: ['학습 곡선이 존재', 'JSX 문법에 적응 필요', '빈번한 업데이트'],
  use_cases: ['SPA 개발', '대시보드', '모바일 앱 (React Native)'],
  generated_at: '2026-04-14T00:00:00.000Z',
};
