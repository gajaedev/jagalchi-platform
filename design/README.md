# Jagalchi Core V3 웹 현재 상태 가이드

기준 시각: 2026-09-01

이 문서는 현재 웹 V3 구현과 유지보수 계약의 canonical guide다. 과거 설계의 단계별 기록은 이 문서에 다시 쌓지 않는다. 배포 가능성은 [WIP.md](../WIP.md)가 별도로 관리한다.

## 현재 판정

- 디자인 기준은 `design/jagalchi-app-first.pen`의 V3 rollout canvas `IqGIs`다.
- 웹 화면 기준은 `10.1 Web Home`(`fIAMO`), `10.2 Web Explore`(`P6Y5xE`), `10.3 Web Roadmap Detail`(`CGmiw`)다.
- Cycle 4의 판정은 **SHIP**이다. Wanted Sans 저장소 에셋·provenance·runtime computed-font, semantic black/white theme, 공통 shell, Home, Explore, Viewer의 CSS/a11y-only 변경이 구현·검증됐다.
- 기존 route, auth 진입, analytics, search/filter, Viewer lifecycle은 보존한다. 이번 V3 범위에는 승인되지 않은 pre-workspace detail 전이를 포함하지 않는다.
- 이 판정은 웹 표면의 상태다. 실제 secret 기반 Compose, 외부 provider, 서버 복구, cutover/rollback을 증명하는 판정은 아니다.

근거가 되는 과거 기록은 [Cycle 4 memo](./RE0-MEMO-20260831-V3-WEB-CYCLE-4.md), [Cycle 3 memo](./RE0-MEMO-20260831-V3-WEB-CYCLE-3.md), [Preset](./PRESET-coursebook-20260831.md), [Forensics](./FORENSICS-20260831.md)다. 이 파일에서는 그 기록의 결론과 현재 유지보수에 필요한 계약만 사용한다.

## 구현 범위와 파일 매핑

| 영역 | 현재 진입점 | 현재 계약 |
| --- | --- | --- |
| Font/runtime | `apps/web/src/app/layout.tsx`, `apps/web/src/app/fonts/*` | 저장소의 Wanted Sans를 `next/font/local`로 로드하고 UI의 computed family를 확인한다. |
| Semantic theme | `apps/web/src/app/globals.css` | Light/Dark 모두 black/white 행동 위계를 semantic 변수로 표현한다. |
| Shared shell | `apps/web/src/components/app-shell/*` | Header, mobile navigation, skip link, focus ring, safe-area와 기존 route를 유지한다. |
| Home | `apps/web/src/app/page.tsx`, `apps/web/src/components/product/*` | Guest/signed Home의 기존 제품 의미·링크·analytics를 유지하면서 V3 hierarchy를 적용한다. |
| Explore | `apps/web/src/app/explore/page.tsx`, `apps/web/src/features/explore/*` | `q`/`topic` URL 상태와 `listPublicRoadmaps({ search, tag })` 계약을 유지하며 API/fixture 데이터만 표시한다. |
| Viewer | `apps/web/src/features/roadmap-viewer/components/*` | Header, toolbar, canvas/cards, sidebar의 CSS/class와 명시적 a11y 상태만 바꾼다. ReactFlow·graph·node/editor 데이터와 lifecycle은 건드리지 않는다. |
| Browser contract | `apps/web/e2e/*`, `apps/web/playwright.config.ts`, `apps/web/src/mocks/*` | MSW fixture와 build-time public flag를 같은 E2E server mode로 선택한다. |

## 유지해야 하는 시각 계약

### Wanted Sans

- 에셋: `apps/web/src/app/fonts/WantedSansVariable.woff2`
- 버전: Wanted Sans v1.0.3
- provenance/license: `WANTED-SANS-NOTICE.txt`, `WANTED-SANS-OFL.txt`
- SHA-256: `4259e7e9a172e634c2cb419d793b84148990316341e910443e5d10965b2c8f16`
- `layout.tsx`의 `next/font/local` loader가 `--font-wanted-sans`를 제공하고 `globals.css`의 `font-sans`가 이를 사용한다.
- UI 전 영역은 Wanted Sans의 400/500/600/700/800 weight를 사용한다. JetBrains Mono는 실제 code/monospace 의미가 있는 콘텐츠에만 남긴다.
- 저장소 파일, `document.fonts.check()`, computed `font-family`, 한글·영문 혼용 줄바꿈을 함께 확인하기 전에는 폰트 통과를 선언하지 않는다.

### Semantic black/white theme

| Role | Light | Dark | 용도 |
| --- | --- | --- | --- |
| `background` | `#FFFFFF` | `#000000` | 페이지 배경 |
| `foreground` | `#000000` | `#FFFFFF` | 기본 텍스트·아이콘 |
| `surface` | `#FFFFFF` | `#0A0A0A` | 카드·컨트롤 표면 |
| `surface-raised` | `#FFFFFF` | `#141414` | 상승된 표면 |
| `muted` | `#F5F5F5` | `#141414` | 보조 표면 |
| `muted-foreground` | `#666666` | `#A3A3A3` | 보조 텍스트 |
| `border` | `#E6E6E6` | `#292929` | divider 전용 |
| `primary` | `#000000` | `#FFFFFF` | 주 행동 |
| `primary-foreground` | `#FFFFFF` | `#000000` | primary 위 텍스트 |
| `primary-subtle` | `#F3F3F3` | `#1A1A1A` | neutral subtle surface |
| `ticket` | `#000000` | `#FFFFFF` | 티켓 표면·행동 |
| `ticket-subtle` | `#F3F3F3` | `#1A1A1A` | 티켓 보조 표면 |

`success`, `warning`, `error`는 상태 전달에만 사용한다. blue/purple는 브랜드, CTA, AI identity에 사용하지 않는다. `border`는 단독 focus/control cue로 쓰지 않으며, interactive 상태는 2px contrasting focus ring과 비색상 상태 정보로도 확인한다.

## 동작 보존 계약

### Home

- `/`의 guest/signed 렌더링과 `/login`을 통한 signed entry를 유지한다.
- 현재 커리어 증거 제품의 카피, 링크, feature flag와 recommendation analytics를 유지한다.
- 디자인 목업에만 있는 progress, rating, duration, learner count를 API/fixture 없이 만들지 않는다.
- 단일 주인공 hierarchy는 시각 계약이며, 기존 제품 의미와 route를 학습 제품으로 교체하는 승인이 아니다.

### Explore

- `/explore`의 검색은 `q`, 주제는 `topic`으로 URL에 남고 서로의 값을 지우지 않는다.
- `topic=전체`는 필터가 없음을 뜻하며, API 요청은 현재 domain contract의 `search`/`tag`만 사용한다.
- 결과는 `RoadmapCard`의 실제 API/fixture projection 하나로 렌더링한다. mock-only metadata나 별도 curated featured fetch를 추가하지 않는다.
- 현재 계약으로 동작하지 않는 sort/level/date UI를 다시 추가하지 않는다.

### Viewer

- public fixture `/viewer/11111111-1111-4111-8111-111111111111`와 loading/error truth를 유지한다.
- Canvas/Card mode, sidebar, zoom, export, save-image, fork-tree, fork, AI coach의 기존 surface와 analytics를 유지한다.
- `ReactFlowProvider`, `useViewerRoadmapLoader`, atoms, canvas/card/sidebar/toolbar ownership과 breakpoint lifecycle을 유지한다.
- 이번 V3 변경은 Viewer shell의 CSS/class 및 누락된 accessibility state(`aria-pressed`, item-qualified labels 등)뿐이다. DOM reparenting/reordering, conditional remount, node/edge/graph schema 변경은 범위 밖이다.
- 승인되지 않은 pre-workspace detail 화면 또는 상세에서 작업공간으로의 새 전이는 포함하지 않는다.
- roadmap node/editor 색상은 제품 데이터 계약이므로 공통 shell theme 변경으로 재설계하지 않는다.

### Shell, auth, analytics

- canonical logo는 `apps/web/public/jagalchi.svg`를 그대로 사용한다. SHA-256은 `bf328b86d3bc996a105b99f1feaf2199270d4253c2d94d3b82098b968e5c94a2`다.
- `/`, `/explore`, `/viewer/[id]`, `/login`, `/tickets`의 route와 인증 redirect를 시각 변경과 함께 바꾸지 않는다.
- analytics event 이름과 승인된 payload privacy 계약을 유지한다. 콘텐츠 identifier나 provider-private field를 recommendation/view 이벤트에 넣지 않는다.

## 브라우저·정적 검증 게이트

모든 변경은 다음을 같은 working tree에서 재실행한다.

```bash
pnpm --filter @jagalchi/web lint
pnpm --filter @jagalchi/web exec tsc --noEmit
pnpm --filter @jagalchi/web test:run
pnpm --filter @jagalchi/web build
```

MSW 브라우저 검증은 public `NEXT_PUBLIC_*` 값을 build와 serve에 동일하게 주고, `E2E_USE_PRODUCTION_SERVER=true`를 명시한다. `CI` 같은 ambient 환경변수로 server mode를 선택하지 않는다. 현재 독립 검증의 기준 결과는 Web unit 153 files / 1007 tests passed이며, MSW production-server Playwright는 75 passed와 기존 `apps/web/e2e/editor.spec.ts`의 `test.fixme` 1 skip이다. 이 결과는 실제 Compose나 외부 provider의 full-feature 증거가 아니다.

브라우저에서 다음을 확인한다.

- 390px와 1440px, Light와 Dark에서 `scrollWidth === clientWidth`, clipping, overlap이 없다.
- `document.fonts.check()`와 computed `font-family`가 Wanted Sans를 가리킨다.
- normal text 대비는 4.5:1 이상, control/focus cue는 3:1 이상이다.
- primary/inverse/pressed/disabled/focus-visible 상태가 두 테마에서 같은 의미를 유지한다.
- `/`, `/explore`, 실제 fixture Viewer, `/login`, `/tickets`를 실제 route로 drive한다.
- Explore 검색·topic·history, Home guest/signed entry, Viewer mode/sidebar/menu/zoom/fork surface를 추측하지 않고 조작한다.

## 변경 시 금지 사항

- `design/jagalchi-app-first.pen`의 SOURCE 원본, 모바일 원본 화면, 공유 token/master를 웹 변경과 함께 수정하지 않는다.
- 목업 문구를 근거로 API, fixture, route, auth, analytics를 임의 변경하지 않는다.
- 시스템 폰트 설치만으로 Wanted Sans를 승인하지 않는다.
- 새 blue/purple brand paint, gradient, 장식용 logo/wordmark, raw theme color를 추가하지 않는다.
- Viewer graph/node/editor 소스와 lifecycle을 shell restyle에 섞지 않는다.
- 생성된 Playwright report를 source lint 대상으로 만들지 않으며, 실패·skip을 통과로 세탁하지 않는다.

## 웹 표면의 완료 기준

웹 V3 유지보수 변경은 다음을 모두 만족할 때만 완료로 본다.

- 해당 화면의 hierarchy와 responsive composition이 V3 계약과 일치한다.
- route, auth, analytics, search/filter, Viewer interaction/lifecycle에 회귀가 없다.
- Wanted Sans 저장소 에셋·license·computed runtime과 한글 장문 bounds가 확인된다.
- blue/purple brand paint가 없고 semantic status 색이 상태 용도로만 쓰인다.
- 390px/1440px Light/Dark에서 overflow·clipping·overlap이 없다.
- keyboard focus, disabled/error/pressed, dark mode를 브라우저에서 확인한다.
- 변경 파일과 실행 결과를 리뷰 가능한 단위로 기록한다.
