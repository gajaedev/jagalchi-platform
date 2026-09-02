# Jagalchi WIP

기준 시각: 2026-09-02 KST

검토 기준선: `worktree/quiet-cloud-774d`의 `bdaf1b0da7fe` 이후 현재 working tree. 구현을 시작할 때 최신 `HEAD`에서 완료된 진단 수치를 다시 검증한다.

Repository home: `https://github.com/stacking-money-forever/jagalchi-platform`. 2026-09-02에 기존 `gajaedev/jagalchi-platform`을 이름과 공개 상태를 유지한 채 조직 이전했고, 이전 URL은 새 위치로 redirect된다.

Vercel project `jagalchi-platform`도 새 조직 repository로 다시 연결했다. Production branch는 `main`, Root Directory는 `apps/web`, 기존 production deployment와 `jagalchi.justn.me` alias는 유지됐다.

## 현재 판정

Jagalchi는 기능이 넓게 구현된 프로토타입이지만 아직 하나의 완성된 제품은 아니다. 현재 프론트엔드는 부분 개선보다 제품 구조, 라우팅, 데이터 로딩, 상태 UX, 디자인 시스템을 다시 세우는 전면 재구축이 더 합리적이다.

지금부터 기능 확장을 멈추고 다음 원칙으로 진행한다.

- 현재 출시 대상은 Web과 이를 지원하는 API·AI 서비스다. Native Mobile, Apple 배포, IAP는 후속 단계로 유지한다.
- 기존 프론트엔드는 기능·계약·실패 사례를 확인하는 reference implementation으로 취급한다.
- 새 프론트 방향이 승인되기 전에는 제품 화면을 변경하지 않는다.
- 검증된 백엔드 기반은 보존하되, 전체 기능 활성화 전에 권한·원자성·idempotency 차단 이슈를 해결한다.
- 현재 상태를 `deployment-ready` 또는 공개 출시 가능 상태로 판정하지 않는다.

## 완료된 진단

- 전체 코드 품질 리뷰를 수행하고 GitHub 이슈 #26~#41을 등록했다.
- UX, 접근성, SEO, 오류 복구, 반응형 동작을 코드와 실제 렌더 화면에서 재검토했다.
- GitHub, FigJam, Wanted를 각각 제품 셸, 캔버스 편집, 탐색·상세·프로필 구조의 참고 축으로 정했다.
- 현재 프론트엔드는 랜딩, 앱 셸, 라우트 구조, 상태 UX가 서로 연결되지 않는다는 결론을 내렸다.
- Nest API는 lint, build, 27개 테스트 파일과 201개 테스트를 통과했다.
- API 테스트 소스까지 포함한 전체 TypeScript 검사는 현재 실패하며 CI가 이를 차단하지 않는다.
- Django AI는 실제 제품 데이터보다 mock 데이터 의존도가 높고, 일부 객체 API에 로드맵 단위 권한 검증이 없다.
- 배포, 마이그레이션, 백업·복구, GitHub Evidence 흐름에는 재사용할 기반이 존재한다.

## Backend repository split

상태: **copy 완료, cutover·원본 제거 미착수**.

2026-09-02에 backend와 production orchestration을 다음 공개 저장소로 copy-first 추출했다.

- `stacking-money-forever/jagalchi-api`: NestJS API와 TypeORM migration, 독립 pnpm lockfile·Dockerfile·CI
- `stacking-money-forever/jagalchi-ai`: Django AI runtime과 migration, 독립 Dockerfile·CI
- `stacking-money-forever/jagalchi-infra`: image 기반 production Compose, ingress, backup, smoke, rollback, CD

API와 AI는 기존 서브트리 Git 이력을 보존했다. Infra는 여러 경로를 합치는 새 운영 산출물이므로 정적 계약 검증을 통과한 조립 기준선에서 새 이력을 시작했다. 이는 production 배포 검증을 의미하지 않는다. 원본 저장소의 `services/api`, `services/ai`, `compose.production.yml`, `deploy/`는 아직 제거하지 않는다.

전환 기간 source-of-truth 규칙:

- 현재 Cloudtype production을 위한 긴급 hotfix는 원본 monorepo에 먼저 적용하고 새 API repo로 즉시 forward-port한다.
- 계획된 Backend 안전선과 신규 API 작업은 `jagalchi-api` 또는 `jagalchi-ai`에서만 시작한다.
- `jagalchi-infra`는 production-equivalent smoke와 cutover를 통과한 뒤 production orchestration 정본이 된다. 그전까지 원본 `deploy/`는 현재 Cloudtype 운영 fallback과 과거 증거를 함께 소유한다.
- 같은 기능을 양쪽에서 병렬 수정하지 않는다. 원본 제거 PR이 병합되면 monorepo backend 경로는 더 이상 수정하지 않는다.

제거 조건:

- [x] 세 새 저장소의 초기 CI 성공
- [ ] API와 AI image publication·version pin 정책 승인
- [ ] Infra에서 pinned API·AI image를 사용한 production-equivalent smoke 성공
- [ ] Web의 새 API origin·contract 연결 방식 승인
- [ ] 원본 저장소에서 제거하는 migration PR 별도 승인

상세 배포 절차와 과거 검증 증거는 다음 위치에서 관리한다.

- 다음 개인 서버 orchestration 후보: `stacking-money-forever/jagalchi-infra/deploy/README.md`
- 현재 monorepo·Cloudtype 운영 fallback과 과거 증거: `deploy/README.md`
- `services/api/CLOSED_ALPHA_REMAINING.md`

## 현재 저장소 구조

```text
.
├── apps/
│   ├── web/                 # 현재 Next.js 프론트엔드
│   └── mobile/              # 후속 Native Mobile, 현재 Web 재구축 범위 밖
├── services/
│   ├── api/                 # canonical NestJS API와 PostgreSQL migrations
│   └── ai/                  # Django AI 서비스
├── deploy/                  # 개인 서버 배포, smoke, rollback, CD 스크립트
├── design/                  # 현재 디자인 문서와 원본
├── compose.yml              # 로컬 통합 환경
└── compose.production.yml   # 개인 서버 production 후보
```

이 구조는 backend split cutover 전의 현재 worktree다. 제거 조건을 통과하면 backend와 production orchestration 경로를 monorepo에서 제거한다. 프론트 재구축의 직접 대상은 `apps/web` 내부 책임과 라우트다.

## 프론트엔드 목표 구조

아래 구조는 구현 전 승인할 후보 계약이다. 현재 파일을 이 구조로 기계적으로 이동하지 않는다.

```text
apps/web/src/
├── app/
│   ├── (marketing)/                     # 랜딩과 제품 설명
│   │   └── page.tsx                     # /
│   ├── (public)/                        # 검색 노출 가능한 공개 결과
│   │   ├── explore/page.tsx             # /explore
│   │   ├── roadmaps/[slug]/page.tsx     # /roadmaps/:slug
│   │   └── profiles/[username]/page.tsx # /profiles/:username, Profile·Proof 결합 가설
│   ├── (auth)/                          # 로그인·가입·복구
│   ├── (workspace)/app/                 # GitHub형 인증 사용자 제품 셸
│   │   ├── page.tsx                     # /app
│   │   ├── roadmaps/                    # 목록·학습·진행
│   │   ├── career/                      # Evidence와 커리어 증명
│   │   ├── activity/                    # 활동과 알림
│   │   └── settings/                    # 계정과 환경 설정
│   ├── (canvas)/app/roadmaps/[id]/edit/ # FigJam형 독립 편집 공간
│   ├── global-error.tsx
│   ├── not-found.tsx
│   └── layout.tsx
├── domains/                              # Roadmap, Profile, Evidence 등 도메인 모델
├── features/                             # 사용자가 수행하는 기능 단위
├── shared/                               # 토큰, primitive, 공통 UI와 유틸리티
├── server/                               # 서버 전용 API client, metadata, loaders
└── test/                                 # fixture, MSW, 통합 테스트 지원
```

구조 원칙:

- `app`은 URL, metadata, boundary, composition만 담당한다.
- 공개 페이지는 서버 렌더링과 올바른 HTTP status를 기본으로 한다.
- 브라우저 mutation과 서버 데이터 조회를 같은 API wrapper에 섞지 않는다.
- 도메인 모델은 화면 컴포넌트나 mock 응답에 종속되지 않는다.
- `loading`, `error`, `not-found`, offline, retry 상태는 기능 완료 조건에 포함한다.
- 에디터는 일반 앱 셸에 억지로 넣지 않고 별도 canvas shell을 사용한다.
- 기존 URL을 유지할지 redirect할지는 라우트 계약 승인 시 결정한다.

## 목표 라우팅

```text
Public
/                         제품 랜딩
/explore                  로드맵 탐색
/roadmaps/:slug           공개 로드맵 상세
/profiles/:username       공개 프로필과 Proof

Authenticated
/app                      개인 워크벤치
/app/roadmaps             내 로드맵
/app/roadmaps/:id         학습과 진행
/app/roadmaps/:id/edit    로드맵 편집기
/app/career               커리어와 Evidence
/app/activity             활동과 알림
/app/settings             계정과 환경 설정
```

아직 결정하지 않은 항목:

- 기존 `apps/web` 안에서 v2를 구축할지, 임시 `apps/web-v2` 패키지로 격리할지
- 첫 exemplar를 `landing → explore → public roadmap → fork`로 할지, 로그인 후 개인 워크벤치로 할지
- `/community`를 `/explore`로 통합할지 별도 사회적 피드로 유지할지
- 기존 roadmap UUID URL과 새 public slug URL의 호환 정책
- Profile과 Proof를 한 공개 페이지에 합칠지 분리할지
- API contract 공유를 OpenAPI 생성 client로 할지 별도 contract package로 할지

목표 라우팅에 `/community`가 없는 것은 삭제 결정이 아니라 위 결정을 보류했기 때문이다. `/profiles/:username`의 Profile·Proof 결합 역시 승인 전 가설이다.

## 제어 계약

- 제품 계약, IA, preset, exemplar 방향의 승인권자는 사용자다.
- 승인은 대화에서 명시적으로 확인하고 이 문서의 해당 체크박스와 결정 내용을 함께 갱신한다.
- inventory는 `docs/frontend-v2/INVENTORY.md`에 route, feature, API, state, test, preserve 후보, blocker 필드를 가진 표로 작성한다.
- 구조 방향과 preset은 `docs/frontend-v2/` 아래 별도 문서로 남기며 승인 전 product screen을 변경하지 않는다.
- Backend 안전선과 프론트 v2 기반은 제품 계약과 공유 API 경계가 승인된 뒤 병렬 진행할 수 있다.
- 긴급 수정은 활성 보안 취약점, 데이터 손실·손상, credential 노출, 현재 production outage만 허용한다. 신규 기능, 시각 개선, 비차단 refactor는 동결한다.

## 보존·폐기·검토

### 보존

- 인증, GitHub Evidence, 별도 reviewer, migration과 rollback 계약
- 검증된 API DTO와 API client 동작
- 유효한 fixture와 테스트 데이터
- AppShell의 skip link와 landmark 구현
- Public Proof의 서버 렌더링과 semantic structure
- 도메인 용어와 PostgreSQL 데이터 모델

### 폐기 또는 재구축

- 현재 랜딩과 홈의 정보 구조
- 화면별로 분리된 시각 언어와 내비게이션
- 클라이언트 fetch 중심의 공개 탐색 페이지
- 막다른 로딩·오류·빈 상태
- viewer soft-404와 placeholder metadata·JSON-LD
- 직접 구현한 접근성 미완성 popover·menu
- mock 데이터의 성공을 실제 제품 통합 증거로 취급하는 테스트 방식

### 검토 후 결정

- 현재 디자인 토큰과 primitive 중 재사용할 범위
- 에디터의 canvas 구현과 실시간 동기화 계층
- 현재 query hooks와 전역 상태 atom
- analytics event taxonomy
- 기존 route redirect와 데이터 migration 기간

## 출시 차단 이슈

### Backend P0·P1

- **P0, 신규**: Django Init Data 상세·수정·삭제와 node generation의 object-level authorization 부재
- **P1, #31**: AI idempotency key 재사용 시 외부 AI가 다시 실행되는 비용·회계 결함
- **P1, #31 확장**: 프로세스 장애 후 `RESERVED` 티켓을 복구하는 durable job·reconciliation 부재
- **P1, #36**: 회원 생성과 ticket account 생성의 비원자성
- **P1, #30·#35**: 공개 프로필 이메일 노출과 non-unique name 기반 조회
- **P1, #38 확장·신규**: 댓글·알림, 업로드 DB·object storage 사이의 부분 성공 처리

### Frontend P0·P1

- **P1, 신규**: 제품 가치와 사용 루프를 설명하는 랜딩 부재
- **P1, 신규**: 공개 viewer soft-404, placeholder JSON-LD, 정적 metadata
- **P1, 신규**: 의미 있는 Suspense·loading·global error·retry 체계 부재
- **P1, 신규**: 공개 탐색 결과의 client-only fetch와 crawler-visible content 부족
- **P1, 신규**: 커뮤니티·viewer의 landmark, heading, keyboard interaction 결함
- **P1, #40 확장**: transient auth refresh 실패를 세션 만료로 처리해 작업 맥락을 잃을 수 있음

### Infrastructure·quality

- 현재 Cloudtype Free API의 무인 availability 실패
- 실제 secret 기반 full-feature Compose와 E2E 미검증
- API test source TypeScript 오류와 불완전한 CI gate
- Nest request correlation, structured application logging, metrics, tracing 부족
- AI readiness가 DB와 필수 provider의 실제 준비 상태를 증명하지 않음

## 실행 단계

### 0. 기능 동결과 기준선

- [x] 광범위 코드·UX·백엔드 리뷰
- [x] 기존 문제 GitHub 이슈화
- [x] 재설계 reference 수집
- [x] 현재 실패 패턴과 품질 게이트 정리
- [x] 재구축 중 허용할 긴급 수정 기준 정의
- [ ] 기존 route·feature·API·test inventory 확정

완료 조건: 무엇을 보존하고 무엇을 폐기하는지 누락 없이 추적할 수 있다.

### 0.5 Backend split 안정화

- [x] 공개 `jagalchi-api`, `jagalchi-ai`, `jagalchi-infra` 생성
- [x] API·AI 서브트리 Git 이력 보존
- [x] 서비스별 standalone dependency·Dockerfile·CI 구성
- [x] Infra를 source build가 아닌 pinned service image 조합으로 변경
- [x] 세 저장소 초기 CI 성공
- [ ] API·AI image publication과 immutable tag 정책 승인
- [ ] Infra production-equivalent smoke와 rollback 검증
- [ ] Web API origin·contract 전환 방식 승인
- [ ] 원본 backend·infra 경로 제거 PR 승인과 병합

완료 조건: 신규 backend 작업 위치가 새 저장소로 단일화되고, 원본 경로 제거 후에도 build·deploy·rollback 계약이 유지된다.

### 0.6 Platform transfer 안정화

- [x] `stacking-money-forever/jagalchi-platform` 조직 이전
- [x] 기존 GitHub URL redirect와 local remote 갱신
- [x] Vercel GitHub App의 새 조직 repository 접근 승인
- [x] 기존 Vercel project를 새 조직 repository에 연결
- [x] transfer 이후 branch push의 Preview Deployment 성공
- [x] 기존 production deployment·domain·API readiness 유지

완료 조건: 새 조직의 branch push와 `main` push가 각각 Preview와 Production deployment를 생성하고 기존 domain이 유지된다.

### 1. Forensics와 보존 경계

- [ ] 현재 화면과 route의 구조·시각 결함 forensics
- [ ] inventory의 각 항목을 `PRESERVE / KILL / QUESTION`으로 분류
- [ ] 보존할 URL, API, 데이터, 테스트와 폐기할 화면 가정 확정
- [ ] 활성 보안·데이터 사고 여부와 즉시 완화 필요성 확인

완료 조건: 기존 구현의 무엇이 자산이고 무엇이 오해를 만드는 진척인지 파일·계약 단위로 구분된다.

### 2. 제품 계약, 구조 방향과 preset 승인

- [ ] 핵심 사용자와 한 문장 가치 제안 승인
- [ ] `목표 → 로드맵 → 실행 → Evidence → Profile → Discovery` 기본 루프 승인
- [ ] 공개 영역, 인증 앱, canvas editor의 경계 승인
- [ ] 목표 URL과 legacy redirect 정책 승인
- [ ] 첫 exemplar journey 선정
- [ ] 서로 다른 구조 방향 3개 작성
- [ ] 2~3개 preset으로 수렴
- [ ] 사용자 preset 승인 receipt 기록

완료 조건: 구현자가 route와 책임을 추측할 필요가 없으며, 승인된 preset 전에는 product screen mutation이 없다.

### 3. Backend 안전선

- [ ] AI object authorization과 negative integration test
- [ ] durable AI job, 결과 저장, ticket reconciliation
- [ ] 회원 bootstrap transaction 정리
- [ ] unique public username과 개인정보 응답 계약
- [ ] comment notification outbox 또는 동등한 보상 설계
- [ ] upload cleanup과 object-storage reconciliation
- [ ] API test source typecheck CI gate

완료 조건: 프론트가 의존할 auth, ownership, accounting 계약이 실패 상황에서도 유지된다.

### 4. 프론트 v2 기반

- [ ] v2 격리 방식 결정
- [ ] route skeleton과 public/workspace/canvas shell
- [ ] design token, typography, spacing, radius, interaction 계약
- [ ] 서버 조회와 브라우저 mutation client 분리
- [ ] global error, not-found, route loading과 metadata 기본 계약
- [ ] accessibility와 reduced-motion 기본 gate

완료 조건: 콘텐츠가 없어도 route, boundary, keyboard, mobile 구조가 검증된다.

### 5. Exemplar

- [ ] 승인된 journey의 대표 화면 1~2개 구현
- [ ] happy, loading, empty, error, offline, unauthorized, not-found 상태
- [ ] desktop, 390px mobile, keyboard-only, 200% zoom 검증
- [ ] SSR HTML, status code, canonical, OG, JSON-LD 검증
- [ ] 기존 디자인으로 회귀하지 않았는지 사용자 재확인

완료 조건: 사용자 승인과 structural, accessibility, visual, design-intent QA가 모두 통과한다.

### 6. Screen family rollout

- [ ] landing과 public discovery
- [ ] public roadmap와 profile·Proof
- [ ] authenticated workspace와 roadmap learning
- [ ] career와 Evidence
- [ ] canvas editor와 realtime
- [ ] activity, notifications, settings, auth long-tail

완료 조건: 각 family가 exemplar 계약과 동일한 상태·접근성·반응형 기준을 지킨다.

### 7. 실제 통합과 출시

- [ ] Web → Nest → PostgreSQL integration
- [ ] Web → Nest → Django AI durable job flow
- [ ] upload public/private 경계와 cleanup
- [ ] OAuth, email, GitHub App Evidence
- [ ] 실제 provider bounded smoke
- [ ] full-feature Compose, restart, backup, restore, rollback
- [ ] production observability와 alert

완료 조건: mock 없이 핵심 journey가 통과하고 무인 복구와 rollback이 증명된다.

## 작업 규칙

- 승인 전 디자인 구현 금지
- 새 기능보다 차단 이슈와 primary journey 우선
- 원본 디자인과 현재 프론트는 rollback·negative corpus로 보존
- 한 번에 전체 화면을 바꾸지 않고 exemplar부터 검증
- 테스트 통과와 제품 완성도를 같은 의미로 사용하지 않음
- mock, 정적 분석, 구조 검증이 증명하지 않은 것을 완료로 보고하지 않음
- 비밀값, 토큰, 원본 credential을 문서·Git·로그에 기록하지 않음

## 다음 행동

세 분리 저장소의 초기 CI와 source-of-truth 규칙은 확정됐다. Backend image publication과 cutover는 별도 승인 게이트에 남겨둔 채, `docs/frontend-v2/INVENTORY.md`에 현재 route·feature·API·state·test inventory를 만든다. 이어서 forensics와 `PRESERVE / KILL / QUESTION`을 확정하고, 제품 계약과 IA를 승인받은 뒤 구조 방향 3개와 preset을 제시한다. 사용자 승인 전에는 프론트 구현을 시작하지 않는다.
