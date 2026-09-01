# RedesignPreset — Jagalchi Core / 코스북 구조 (2026-08-31)

> 상태: **ROLLOUT_COMPLETE v3 · FULL_QA 구조/의도 통과 · product font gate 보류** — v2는 역사적 구조안, v3가 유효 시각 계약. Wanted Sans runtime asset/computed-font gate 전에는 product shipment 불가
> 상위 문서: `design/FORENSICS-20260831.md` (Phase 1~3 근거) · 방향 A 구조는 미승인 가설
> 적용 대상: `design/jagalchi-app-first.pen` — 기존 화면군과 분리된 캔버스 영역에 V2 보드(x=3916,y=0)와 1장 미리보기(x=3446,y=0)만 갱신
> 승인 전 product screen mutation 0건. 원본 57 루트·공유 토큰 44개 무변경.

---

## Historical v2 Contract (archived; do not apply)

- **redesign_depth**: `full` (구조+비주얼 전면)
- **preservation_budget**: product_logic **strict** / ia **medium** / components **medium**(라이브러리 보존) / visual_language **low**
- **mutationPolicy**: `apply-after-approval`
- **보존 방식 (핵심)**: 공유 토큰을 바꾸지 않는다. 승인 시 **가산 변수 포크 `--v2-*` 8개**만 추가하고 V2 화면을 그쪽으로 리바인딩한다. 원본 57 루트는 `$--v2-*` 참조 0건을 QA로 강제한다(QA1). 복원 = V2 루트 삭제 1단계.

```ts
const preset: RedesignPreset = {
  name: "코스북 (Coursebook)",
  thesis:
    "홈은 대시보드가 아니라 오늘의 한 페이지다. 진행 중 레슨이 유일한 주인공이고 통계·추천은 각주다. 유료 AI 티켓은 퍼플로 분리된 자기 표면을 가진다.",

  preserve: [
    "32종 컴포넌트 라이브러리 + 높은 채택률 (Card/Roadmap ×22, 칩 ×61, 상태바 51화면 ref) — 평행 프리미티브 금지",
    "44개 시맨틱 토큰 spine + Light/Dark 바인딩 — 값 교체 대신 가산 포크 --v2-* (원본 토큰 무변경)",
    "lucide 아이콘 100% 통일 (20px 표준 / 16px 인라인)",
    "5탭 중 탐색·활동·마이 + 상태 화면 7종 커버 + 390 모바일 셸",
    "티켓 퍼플(--ticket #6657E8/#8B7DFF) — 스킨 뿌림에서 표면 세계로 승격",
    "제품 카피·도메인 정보(로드맵/레슨/티켓 경제) 전부",
  ],

  remove: [
    "타이포 하드코딩 443개 — V2 범위 화면은 $--type-* 토큰으로 전면 리네임",
    "홈 5모듈 적층(인사+진행+목표+주간통계+추천) → 단일 주인공 구조",
    "홈↔뷰어 '현재 레슨' 블루 카드 복제 — 홈은 입구, 뷰어는 본문으로 역할 분리",
    "블루 대형 블록 만능 패턴 — primary는 화면당 1개 CTA + 챕터 넘버에만",
    "10px 텍스트 62곳 — 기존 --type-xs(11px) 플로어로 V2 범위 전면 마이그레이션",
    "만들기 독립 탭 — 홈 'AI로 로드맵 만들기' 엔트리로 흡수, 5탭→4탭",
    "탐색 피처드 카드 '플로스' 오타",
  ],

  deferred: [
    "웹 3 루트(10.1~10.3) + Web/Header·Workspace Sidebar 컴포넌트 — v2 결정까지 미수정",
    "다크 3 루트(09.7~09.9) — 별도 수정 금지 (공유 컴포넌트 편집이 전파되면 사진 기록만)",
    "폰트 에셋 교체, AI 러닝 코치(06.5)·리소스 검색(06.6) 티켓 표면화, 08.3/08.4/08.5 재디자인 — 확인 후 v2.1",
    "전 사용자 대상 IA 확정(주간 통계 강등 수용 여부)은 게이트에서 승인",
  ],

  layout: {
    shell:
      "390 모바일: 상태바(ref) + 스크롤 콘텐츠 + 4탭 하단 네비(홈·탐색·활동·마이, 76px, 라벨 11). 만들기 탭은 0폭 무화, 홈 'AI로 로드맵 만들기' 엔트리로 흡수.",
    home:
      "단일 주인공. Header(인사 1줄 + 티켓 잔량) → Today's Page 히어로(챕터 넘버 → 레슨 제목 → 메타 → 진행 → 유일한 primary CTA '이어서 학습하기') → '다음 레슨' 리스트 로우 2개(예습) → 'AI로 로드맵 만들기' 엔트리(티켓 비용 고지) → 주간 기록 텍스트 1줄. 통계 카드 그리드·추천 카드 삭제.",
    detail:
      "Learning Viewer는 교재 본문: 상단 위치 표시(2-2 · 12/24) + 콘텐츠 중심 + 하단 이전/다음 페이지 바. 홈의 히어로 카드를 복제하지 않는다.",
    navigation:
      "4탭. 라벨 11/600(기존 10px 교정), 아이콘 20, 활성 $--v2-primary. 센터 버튼 패턴 없음.",
    density:
      "홈 low(주인공 여백) / 탐색·목록 medium(기존 리스트 리듬 유지) / 설정·마이 medium.",
  },

  visual: {
    palette: {
      fork:
        "44개 공유 토큰 무변경. 승인 시 --v2-* 8개 추가(아래 표 = 저자 값), V2 화면만 재바인딩.",
      deltas: [
        "| --v2-primary | Light #1B64DA (원본 #3182F6) / Dark #4593FC 유지 | white 라벨 3.71→5.41:1 AA, Dark 6.15:1 |",
        "| --v2-primary-pressed | Light #164EB0 (원본 #1B64DA) / Dark #6BA8FF 유지 | pressed 7.63:1 |",
        "| --v2-primary-foreground | Light #FFFFFF / Dark #0F1115 (원본 #FFFFFF 공통) | Dark CTA 라벨 6.15:1 |",
        "| --v2-muted-foreground | Light #5D6676 (원본 #6B7280) / Dark #9BA4B4 유지 | 4.55→5.79:1, Dark 5.34:1 |",
        "| --v2-ticket-foreground (신설) | Light #FFFFFF / Dark #141026 | --ticket accent 위 5.13:1 / 5.72:1 |",
        "| --v2-ticket-deep-foreground (신설) | #F0EDFF 양 테마 | --ticket-deep 위 14.67:1 |",
        "| --v2-ticket-deep (신설) | Light #1E1656 / Dark #0D0A1F | 유료 AI 표면 |",
        "| --v2-ticket-pressed (신설) | Light #5342D6 / Dark #8F80FF | 티켓 액션 pressed 4.15:1 / 6.51:1 |",
      ],
      allowedPairs: [
        "Light: #FFF on --v2-primary 5.41 / #FFF on --v2-primary-pressed 7.63 / #FFF on --ticket 5.13 / #FFF on --v2-ticket-pressed 4.15 / #F0EDFF on --v2-ticket-deep 14.67",
        "Dark: #0F1115 on --v2-primary 6.15 / #141026 on --ticket 5.72 / #F0EDFF on --v2-ticket-deep 14.67",
        "foreground·subtle·muted 조합은 기존 값 그대로(라이트 #5D6676 5.79:1)",
        "모든 버튼 일반/pressed/disabled 상태에 위 쌍 적용 — disabled는 --muted/--muted-foreground 3:1 이상 유지",
        "쌍 외 조합·신규 색상값은 이 문서에 먼저 기록된 것만 사용",
      ],
    },
    typography: {
      authorTable: [
        "저자 테이블 (토큰 | 기존 | V2 | action) — 첨부 없이 이 표가 유일 권위:",
        "| --type-2xs | 없음 | 11 | 추가 — 10px 62곳·nav 라벨 이동 대상 |",
        "| --type-xs | 12 | 12 | 유지 |",
        "| --type-sm | 13 | 13 | 유지 |",
        "| --type-md | 15 | 15 | 유지 |",
        "| --type-lg | 18 | 18 | 유지 |",
        "| --type-xl | 22 | 22 | 유지 |",
        "| --type-2xl | 28 | 28 | 유지 |",
        "| --type-3xl | 36 | 36 | 유지 |",
      ],
      system:
        "8단 유지 + 플로어 신설(--type-2xs=11). 화면당 3단 이하(예: 28/15/11). lineHeight는 스팬에 토큰이 없어 속성 값으로 인코딩(제목 1.25, 본문 1.5) — 값 자체는 여기 규정. weight 800 display / 750 heading / 600 label / 500 body.",
      assets:
        "Noto Sans KR + JetBrains Mono — 두 폰트와 weight 750은 문서에서 이미 사용 중(DS 보드 11ea 실측), 신규 에셋 불필요.",
      signature:
        "숫자는 전부 $--font-mono(JetBrains Mono) — 챕터 넘버·날짜·진행 분수·통계 수치. '교재 페이지 번호'가 타이포 서명.",
      migration:
        "V2 범위 화면에서 텍스트 fontSize를 $--type-* 참조로 리네임(443개 중 해당 화면분). 화면 패밀리 단위로 완결 — 부분 혼재 금지.",
    },
    radius: "기존 시스템 유지(sm8/md12/lg16/xl24/full). 히어로·티켓 표면만 xl24.",
    imagery: "썸네일 의존 없음 — 타이포+챕터 넘버+아이콘으로 서열. 이미지는 탐색 상세 커버 정도로 한정.",
    iconography: "lucide 유지. 20px 표준 / 16px 인라인.",
  },

  components: {
    listRow:
      "List Row/Default 재사용 + 좌측 챕터 넘버 슬롯(mono 11). 우측 메타는 mono 11.",
    button:
      "Button/Primary(md12, h48, 라벨 15/700) — 화면당 1개. Secondary=Outline, 나머지 Ghost. 라벨은 $--v2-primary-foreground(테마값).",
    badge:
      "subtle bg + 동일 hue 본문색(기존 Badge/Info 패턴). Ticket 배지는 ticket-subtle bg + --ticket.",
    sheet:
      "Bottom Sheet/Default 유지. 티켓 게이트·AI 생성 = --v2-ticket-deep 배경 + --v2-ticket-deep-foreground(#F0EDFF). accent 배경(--ticket)에서만 --v2-ticket-foreground 사용 — on-deep 조합 금지.",
  },

  interaction: {
    filtering: "탐색 칩 ×61 패턴 유지(Chip/Default·Active 재사용).",
    primaryAction: "홈 '이어서 학습하기' 단일 primary. 모든 부가 행동은 ghost/텍스트.",
    feedback:
      "진행=Progress/Linear+mono 분수. 완료=success 체크. 티켓 소비는 항상 Ticket/Cost Notice로 사전 고지.",
  },

  aiTicketSurfaces: {
    entry: [
      "홈 'AI로 로드맵 만들기' 로우(티켓 비용 고지) → 05.3 Create Entry",
      "05.5 AI Roadmap Goal → 05.6 AI Generating → 05.7 AI Draft Review",
      "마이 → 08.1 Ticket Wallet → 08.2 Ticket Store → 08.3/08.4 확인·완료",
      "게이트: 잔량 부족 → 08.6 Insufficient Tickets / 이력 08.5",
    ],
    anatomy:
      "Ticket/Balance·Pack Card·Cost Notice 재사용. 티켓 액션 버튼 = --ticket 배경 + --v2-ticket-foreground. 게이트 모달·생성 대기 = --v2-ticket-deep + deep-foreground. 라벨은 $--font-mono(잔량·비용·만료 수치).",
    firstRollout: ["홈 엔트리", "05.3", "05.5", "05.6", "05.7", "08.1", "08.2", "08.6 게이트"],
    outOfScope: ["08.3/08.4/08.5", "06.5/06.6 — deferred"],
  },

  risks: [
    "'만들기' 탭 제거로 AI 시작·티켓 소비 경로 발견 가능성 하락(수익 레이어) — 롤아웃 후 탐색 경로 재확인, 홈 엔트리가 유일 대체로 충분한지 exemplar에서 확인",
    "IA 이동(5→4탭, 만들기 흡수)으로 라우트·딥링크 파손 가능 — RN 구현 시 라우트 패리티 목록 검증",
    "443개 타이포 리네임+10→11px 이동 = 전 화면 리플로우(42개 fit-content 포함) — 패밀리 단위 bounds 재검사 필수",
    "격리 포크가 승인 범위 밖 화면을 건드리지 않는다는 보장 — 컴포넌트 편집은 해당 패밀리 내 인스턴스로 한정(원본 04.1에 인스턴스 남발 금지), QA1·2로 강제",
    "대시보드 선호 유저 이탈 — 주간 통계 1줄 강등 수용 여부는 게이트에서 결정",
    "'교재' 메타포가 과목 다양성에 억지로 보일 수 있음 — 챕터 넘버 서명 수용도 확인",
    "ticket-deep 표면이 Light에서 무거울 수 있음 — exemplar QA에서 Light/Dark 대비 검증",
  ],
}
```

---

## Revision v3 — User branding direction (effective)

이번 사용자 피드백은 v2 프리셋의 **거절·수정 요청**으로 처리한다. 구조 방향 A의 “홈 단일 주인공” 제안은 유지하되, 이번 라운드의 계약 범위는 `restyle`이다. 기존 컴포넌트와 semantic token spine을 실제 화면에 적용하는 것이 목표이며, 새로운 브랜드 색·새 로고·새 프리미티브를 임의로 만들지 않는다.

### Direction checkpoint

- **audience**: 한국어 기반 자기주도 개발 학습자. 짧은 세션에서 다음 학습 행동을 빠르게 선택해야 한다.
- **domain**: 로드맵·레슨·AI 보조도구·티켓 경제를 가진 학습 SaaS.
- **visual world**: 제공된 기존 브랜딩처럼 흰 바탕과 검정 마크가 중심인 정제된 SaaS. 장식보다 정보의 명료함과 브랜드 마크의 존재감이 우선이다.
- **signature**: 기존 Jagalchi 마크/워드마크 lockup, 검정 primary action, Wanted Sans의 단단한 한글 UI. 로고를 새로 그리거나 색으로 꾸미지 않는다.
- **hierarchy**: black/white = 브랜드·행동 위계, semantic color = 성공·경고·오류 상태에만 제한. 화면당 주 primary 1개.
- **acceptance**: 파란/보라 brand paint 0(콘텐츠 이미지 제외), UI 텍스트의 최종 shipment는 Wanted Sans computed font 100%, 현재 preview는 Wanted Sans를 사용하고 runtime computed-font 검증 전에는 비출하, canonical logo asset 사용, 기존 32종 컴포넌트·44개 semantic 이름 재사용, 390px clipping 0, 기존 화면/공유 토큰 무변경.

```ts
const presetV3: RedesignPreset = {
  name: "Jagalchi Core — Black / White SaaS",
  thesis:
    "자갈치의 검정 마크와 흰 바탕을 제품의 행동 언어로 확장한다. Wanted Sans가 SaaS 정보 위계를 맡고, 검정 primary가 명확한 다음 행동을 만든다. 색은 브랜드 장식이 아니라 상태를 설명할 때만 쓴다.",

  preserve: [
    "32종 컴포넌트 라이브러리와 기존 anatomy/ref 채택",
    "44개 semantic token 이름·Light/Dark 테마 구조",
    "lucide 아이콘, 390 모바일 셸, 상태 화면 커버리지",
    "제품 카피·로드맵/레슨/AI 티켓 도메인 로직",
    "방향 A의 홈 단일 주인공 구조는 별도 승인 전까지 레이아웃 가설로만 유지",
    "기존 canonical Jagalchi mark — apps/web/public/jagalchi.svg",
  ],

  remove: [
    "브랜드 primary로 쓰이던 #3182F6 파랑과 purple ticket skin",
    "Noto Sans KR fallback/serif/JetBrains Mono를 일반 UI 텍스트에 쓰는 혼용",
    "그라디언트·컬러 wash·장식용 색 블록·임의 pill",
    "로고를 path/도형으로 재제작하거나 워드마크를 임의로 조판하는 행위",
    "컴포넌트 밖의 직접 색상·fontFamily·fontSize 하드코딩",
  ],

  layout: {
    shell:
      "기존 390 모바일 셸·상태바·하단 네비 anatomy 유지. 4탭/만들기 흡수는 방향 A의 별도 구조 승인 범위로 남긴다.",
    home:
      "현재 미리보기의 단일 레슨 주인공 구조 유지. Home hero는 215px 이하(390×844 viewport의 25% 이하), padding 20px/gap 12px, title 22px로 제한한다. 브랜딩 변경은 hierarchy·surface·type만 다루며 콘텐츠 모듈을 추가하지 않는다.",
    detail:
      "학습 뷰어의 정보 구조는 유지. 검정/흰색 surface와 Wanted Sans 위계만 적용한다.",
    navigation:
      "기존 Navigation 컴포넌트 재사용. active는 black/white inverse, 상태 색상은 사용하지 않는다.",
    density:
      "기존 DS spacing/radius 토큰을 따르고 화면 밀도는 구조안 승인 전까지 변경하지 않는다.",
  },

  visual: {
    palette: {
      rationale:
        "기존 로고가 검정/흰색이고 blue primary의 선택 근거가 제품 의미와 연결되지 않는다. 검정 primary는 로고와 행동을 연결하고 Light에서 white 대비 21:1을 만든다.",
      isolatedPreviewAliases: [
        "--v2-background: Light #FFFFFF / Dark #000000",
        "--v2-foreground: Light #000000 / Dark #FFFFFF",
        "--v2-surface: Light #FFFFFF / Dark #0A0A0A",
        "--v2-surface-raised: Light #FFFFFF / Dark #141414",
        "--v2-muted: Light #F5F5F5 / Dark #141414",
        "--v2-muted-foreground: Light #666666 / Dark #A3A3A3",
        "--v2-border: Light #E6E6E6 / Dark #292929",
        "--v2-primary: Light #000000 / Dark #FFFFFF",
        "--v2-primary-pressed: Light #262626 / Dark #E6E6E6",
        "--v2-primary-foreground: Light #FFFFFF / Dark #000000",
        "--v2-primary-subtle: Light #F3F3F3 / Dark #1A1A1A",
        "--v2-ticket: Light #000000 / Dark #FFFFFF",
        "--v2-ticket-subtle: Light #F3F3F3 / Dark #1A1A1A",
        "--v2-ticket-foreground: Light #FFFFFF / Dark #000000",
        "--v2-ticket-deep: Light #000000 / Dark #FFFFFF",
        "--v2-ticket-deep-foreground: Light #FFFFFF / Dark #000000",
      ],
      semanticColors:
        "success/warning/error는 기존 semantic 값을 유지하되 상태 전달에만 사용한다. 브랜드·CTA·AI identity에는 purple/blue를 사용하지 않는다. solid status는 Light black text/icon, Dark black text/icon on bright status; subtle status는 Light black, Dark white를 쓴다.",
      contrastMatrix:
        "role → existing semantic → isolated value(L/D) → allowed pair → minimum: foreground/background #000/#FFF = 21:1; muted #666/#A3A3A3 on #FFF/#000 = 5.74:1 / 8.33:1; primary white-on-black / black-on-white = 21:1; pressed white-on-#262626 / black-on-#E6E6E6 = 15.13:1 / 16.83:1; success black-on-#16A66A / #35C88A = 6.70:1 / 9.78:1; warning black-on-#E98A15 / #FFB14A = 8.11:1 / 11.64:1; error black-on-#E5484D / #FF6B70 = 5.37:1 / 7.59:1; subtle status black-on-Light / white-on-Dark = ≥13.6:1; focus black-on-white / white-on-black = 21:1. Normal text ≥4.5:1, large text and non-text controls/focus ≥3:1.",
      boundary:
        "#E6E6E6 on #FFFFFF(1.25:1)와 #292929 on #0A0A0A(1.36:1)는 decorative divider로만 허용한다. interactive outline/control boundary는 foreground pair 또는 3:1 이상 solid cue를 추가하고, focus는 2px black/white ring으로 독립 전달한다. disabled는 muted surface + muted-foreground를 쓰되 3:1 이상과 disabled semantics를 함께 검증한다.",
    },
    typography: {
      font:
        "UI 전 영역 $--font-body = Wanted Sans. heading/body/label 모두 Wanted Sans family 안에서 weight로 구분한다. 공식 Wanted Sans v1.0.3 한글 패키지(OFL-1.1)를 로컬에 설치했지만 현재 Pencil runtime은 신규 exemplar의 Wanted Sans family를 거부해 V3 canvas가 Noto Sans KR fallback을 사용한다. 이 fallback은 비통과·비출하이며, product runtime은 공식 파일·OFL notice·computed font를 확인하기 전에는 exemplar acceptance·rollout·shipment를 시작하지 않는다.",
      scale:
        "기존 --type-xs 11 / sm 13 / md 15 / lg 18 / xl 22 / 2xl 28 / 3xl 36을 그대로 사용한다. 새 type token을 만들지 않는다. 10px과 임의 12·14·16·20·26 사이즈는 해당 토큰으로 수렴.",
      weights:
        "400 regular / 500 body / 600 label / 700 action / 800 display. Wanted Sans는 7 basic weights를 제공하며 필요한 파일 weight는 400/500/600/700/800이다. 750·font-weight 추측값은 신규 사용하지 않는다. Hangul coverage와 실제 computed font family를 runtime QA로 확인한다.",
      numbers:
        "일반 UI 숫자도 Wanted Sans. JetBrains Mono는 코드 본문·코드 블록처럼 monospace 의미가 실제로 필요한 콘텐츠에만 남긴다. 숫자·한글 혼용 UI를 별도 monospace로 바꾸지 않는다.",
      lineHeight:
        "body 1.5, heading 1.25. letter spacing은 Wanted Sans 기본값을 우선하며 화면별 임의 조정 금지.",
    },
    logo: {
      source:
        "제공된 기존 브랜딩 스크린샷은 visual evidence only이며 추출 가능한 asset으로 취급하지 않는다. 제품 마크는 apps/web/public/jagalchi.svg(20×20 viewBox, black-only, SHA-256 bf328b86d3bc996a105b99f1feaf2199270d4253c2d94d3b82098b968e5c94a2)를 그대로 사용한다.",
      previewAsset:
        "Pencil SVG 렌더 제한으로 현재 preview만 design/assets/jagalchi.png를 사용한다. 이는 위 canonical SVG에서 생성한 비출하 raster derivative(SHA-256 fedb5147c387e2ff6984edea3fb7daa2431ce6bb255ddbba5ffdb792f558f776)이며 product asset으로 승격하지 않는다.",
      lockup:
        "mark/lockup은 onboarding·auth·workspace shell처럼 브랜드를 확인할 기능적 위치에서만 쓴다. Home content header에는 장식용 로고를 넣지 않는다. canonical full wordmark asset이 없으므로 Wanted Sans 텍스트를 기존 로고의 대체 워드마크로 출하하지 않는다. 워드마크는 owner-provided canonical vector가 올 때만 추가한다.",
      rules:
        "검정/흰색 단색만 허용, mark 최소 20×20px, clear space 각 4px 이상, 20×20 viewBox/aspect ratio 보존, path 재제작·rasterize·그림자·그라디언트·색상 변형 금지. Dark에서는 black-only mark를 흰색 28×28 container 위에만 둔다. QA에서 source path/hash, path identity, visibility, clear space를 확인한다.",
    },
    radius:
      "기존 --radius-sm/md/lg/xl/full 유지. SaaS 정제감은 radius를 새로 줄이는 대신 surface·type·spacing으로 만든다.",
    imagery:
      "브랜드 영역은 이미지·일러스트를 쓰지 않는다. 제품 콘텐츠 이미지는 도메인상 필요한 탐색/로드맵 커버에서만 허용.",
    iconography:
      "lucide 유지. 기존 20px 표준·16px 인라인 규칙을 따른다.",
  },

  components: {
    listRow:
      "List Row/Default ref 유지. title/description 모두 Wanted Sans token size, 아이콘과 trailing은 semantic foreground.",
    button:
      "Button/Primary = black Light / white Dark, inverse foreground, 화면당 1개. Secondary = border black/white, Ghost = transparent.",
    badge:
      "기본 badge는 neutral subtle surface. success/warning/error만 상태색. ticket badge는 black/white inverse와 '티켓' 텍스트로 의미를 전달.",
    sheet:
      "Bottom Sheet/Default ref 유지. AI/ticket sheet는 --v2-ticket-deep inverse surface + deep-foreground, purple/blue 없음.",
  },

  interaction: {
    filtering:
      "기존 Chip/Active·Default ref 유지. active는 black fill + white label(또는 Dark inverse)로 처리.",
    primaryAction:
      "검정 primary는 다음 학습 행동과 제출/확인 같은 주 행동에만. 화면당 1개 원칙 유지.",
    feedback:
      "상태 의미는 기존 success/warning/error + icon/text로 전달. 색만으로 상태를 설명하지 않는다.",
  },

  risks: [
    "검정/흰색만으로 모든 hierarchy를 표현하면 surface 경계가 약해질 수 있음 — border·spacing·type QA로 보완",
    "Wanted Sans font loading/fallback 실패 시 line break와 높이가 바뀜 — 390px 장문 bounds를 실제 폰트로 검증",
    "canonical full wordmark asset 부재 — 구현 전 asset 확보 없이는 lockup 적용 금지",
    "purple ticket 제거로 유료 AI 발견성이 낮아질 수 있음 — inverse ticket surface·label·비용 고지로 보완",
    "기존 semantic status color가 브랜드 색처럼 다시 확산될 수 있음 — QA에서 브랜드 fill과 상태 fill을 분리 감사",
  ],
}
```

### v3 범위·보류·QA

- **현재 evidence preview**: `V2.0 · Preset Preview — Home (Jagalchi Core)`(x=3446,y=0) 1개 루트만 허용. Home content header에는 greeting·장식용 logo를 두지 않고 기능 라벨과 ticket affordance만 둔다. Light/Dark는 같은 한 프리뷰의 theme state로 캡처하며, 현재 V3 exemplar는 Pencil Wanted Sans 거부로 Noto Sans KR fallback을 사용한다. 이는 **비출하·비통과**이며 product runtime computed-font 확인 전에는 exemplar로 승인하지 않는다.
- **현재 V3 canvas/exemplar**: 원본과 분리된 새 canvas `V3 · Jagalchi Core — Full Redesign`(x=5356,y=0) 안에 `V3 · Exemplar — 04.1 Home` 1장을 제작했다. Home header에서 greeting·장식용 logo를 제거하고 `오늘의 학습`/ticket affordance만 남겼으며, current lesson hero는 215px로 제한했다. 구조 QA와 visual screenshot 검사는 통과했지만 Wanted Sans runtime gate 전에는 비출하 evidence다.
- **전체 rollout 완료**: 사용자 승인에 따라 새 V3 canvas `IqGIs`에 54개 product screen copy(모바일 51 + 웹 3, Dark 3 포함)를 배치하고 shared token/component 규칙을 적용했다. 원본 54개 product root는 보존한다.
- **rollout receipt**: `{ gate: "redesign-rollout", selectedPreset: "jagalchi-core-mono", approvedByUser: true, canvas: "IqGIs", copies: 54, originalRootsMutated: false, structuralQA: "pass", visualQA: "representative-pass", accessibilityQA: "token-matrix-pass/runtime-pending", productShipmentAllowed: false }`
- **후속 rollout 후보**: 정확히 **42장**(`04.1~04.4` 4 · `05.1~05.8` 8 · `06.1~06.4` 4 · `07.1~07.9` 9 · `08.1/08.2/08.6` 3 · `03.1~03.8` 8 · `09.1~09.6` 6). `06.5/06.6`와 `08.3/08.4/08.5` 5장은 deferred. 웹 3장과 다크 3장 전체 재제작도 deferred다.
- **허용 mutation**: preset board + preview 1장. 승인 전 원본 product roots, 공유 토큰, reusable component master는 건드리지 않는다. preview는 격리 `--v2-*` alias만 사용한다.
- **QA pass 조건**: (1) paint property 전체(fill/text/icon/stroke/border/gradient/shadow/image)에 blue/purple brand 값 0(semantic status allowlist 외), (2) Wanted Sans asset source/license/Hangul/400·500·600·700·800/computed-family 통과 — Noto fallback은 fail, (3) canonical mark source/hash/viewBox/aspect/20px min/4px clear space 및 dark white-container, (4) role별 Light/Dark normal/pressed/disabled/focus contrast matrix, (5) 390px·장문 clipping 0, (6) 기존 component/state coverage 유지, (7) 원본 57 루트·공유 44 토큰·32 master diff 0.
- **승인 receipt**: `{ gate: "redesign-preset", selectedPreset: "jagalchi-core-mono", approvedByUser: true, implementationAllowed: false, scope: ["brand restyle direction", "isolated v2 aliases", "one non-shippable preview", "04.1 exemplar only after Wanted Sans/logo gates"], excluded: ["Noto fallback as final", "original roots", "shared token mutation", "shared master edits", "web 10.1-10.3", "dark 09.7-09.9 rollout", "deferred 06.5/06.6/08.3/08.4/08.5"] }`

### v3 alias mapping and state audit

`--v2-*`는 최종 component API가 아니라 이 프리셋의 격리 preview/exemplar alias다. 각 alias의 source role과 lifetime은 다음과 같다.

| Existing semantic role | Isolated alias | Light / Dark | Scope |
|---|---|---|---|
| `--background` | `--v2-background` | `#FFFFFF / #000000` | V2 roots only |
| `--foreground` | `--v2-foreground` | `#000000 / #FFFFFF` | V2 roots only |
| `--surface` | `--v2-surface` | `#FFFFFF / #0A0A0A` | V2 roots only |
| `--surface-raised` | `--v2-surface-raised` | `#FFFFFF / #141414` | V2 roots only |
| `--muted` | `--v2-muted` | `#F5F5F5 / #141414` | V2 roots only |
| `--muted-foreground` | `--v2-muted-foreground` | `#666666 / #A3A3A3` | V2 roots only |
| `--border` | `--v2-border` | `#E6E6E6 / #292929` | decorative boundary only |
| `--primary` | `--v2-primary` | `#000000 / #FFFFFF` | CTA/action only |
| `--primary-pressed` | `--v2-primary-pressed` | `#262626 / #E6E6E6` | pressed only |
| `--primary-foreground` | `--v2-primary-foreground` | `#FFFFFF / #000000` | primary pair only |
| `--primary-subtle` | `--v2-primary-subtle` | `#F3F3F3 / #1A1A1A` | non-action subtle surface |
| `--ticket` | `--v2-ticket` | `#000000 / #FFFFFF` | ticket accent only |
| `--ticket-subtle` | `--v2-ticket-subtle` | `#F3F3F3 / #1A1A1A` | ticket subtle only |
| `--font-body` | `--v2-font-body` | `Wanted Sans / Wanted Sans` | V2 UI only; current Pencil fallback Noto; product runtime computed-font gate |
| `--success/warning/error` | `--v2-status-*` | existing values unchanged | status allowlist only |
| `--focus` (role alias) | `--v2-focus` | `#000000 / #FFFFFF` | 2px focus indicator |

Allowed existing masters/refs are `Button/Primary`, `List Row/Default`, `Mobile/Bottom Navigation`, `Chip/Active`, `Badge/Info`, `Bottom Sheet/Default`, `Mobile/Status Bar`, `Ticket/Balance`, `Ticket/Cost Notice`. Only `instanceId/childId` overrides are allowed; no parallel component API or master edit. Alias lifetime ends when the V2 preview/exemplar is removed or promoted through a separately approved migration.

**State/paint audit**: every V2 root is scanned across fill, text fill, icon fill, stroke, border, gradient, shadow, opacity and image URL. Blue/purple is forbidden in UI paint; the only allowlist is existing semantic status color, which must include icon/text reinforcement and a recorded contrast pair. Capture Light/Dark screenshots for default, pressed, disabled, focus-visible, success, warning, error, logo visibility, and Korean long-copy at 390px.

**Status alias matrix**:

| Existing role | V2 alias/value | Allowed pair and minimum |
|---|---|---|
| `--success` / `--success-subtle` | `--v2-success`: `#16A66A / #35C88A` · subtle `#E8F8F1 / #153329` | solid black text/icon 6.70:1 / 9.78:1; subtle black Light / white Dark ≥13.6:1 |
| `--warning` / `--warning-subtle` | `--v2-warning`: `#E98A15 / #FFB14A` · subtle `#FFF5E7 / #3A2B18` | solid black text/icon 8.11:1 / 11.64:1; subtle black Light / white Dark ≥13.6:1 |
| `--error` / `--error-subtle` | `--v2-error`: `#E5484D / #FF6B70` · subtle `#FFF0F0 / #3C2024` | solid black text/icon 5.37:1 / 7.59:1; subtle black Light / white Dark ≥14.7:1 |
| `--border` | `--v2-border`: `#E6E6E6 / #292929` | divider only 1.25:1 / 1.36:1; never sole control/focus cue |
| disabled role | `--v2-disabled`: `--v2-muted` + `--v2-muted-foreground` | ≥3:1, plus disabled semantics and non-color state |
| focus role | `--v2-focus`: `#000000 / #FFFFFF` | 2px ring on opposite neutral surface 21:1 and ≥3:1 non-text cue |

---

## Historical v2 approval procedure (archived; do not apply)

**승인이 허용하는 것**:
A. 가산 변수 `--v2-*` 8개 등록 (공유 44개 토큰 무변경).
B. **V2 스코프 화면 47장**: 04탭(04.1~04.4) · 05 만들기(05.1~05.8) · 06 학습(06.1~06.4) · 07 커뮤니티·설정(07.1~07.9) · 08 티켓(08.1, 08.2, 08.6) · 03 인증(03.1~03.8) · 09 상태(09.1~09.6) — 기존 루트를 Copy해 `V2.x` 루트로 생성, 타이포 `$--type-*` 리네임, 챕터 넘버·mono 수치, 4탭 셸, 1-CTA 위계 적용. 인스턴스 오버라이드로만 바인딩(컴포넌트 원본 편집 금지).
C. 공유 컴포넌트 32종: V2 스코프 화면에서 쓰는 인스턴스 경로 오버라이드(`instanceId/childId`)만 — 컴포넌트 정의 노드는 색상·타입 변경 금지(원본 화면 오염 차단).

**승인으로도 못 하는 것**: 공유 토큰 44개 값 변경, 원본 57 루트 수정, 웹(10.x)·다크(09.7~09.9) 루트 수정, deferred 목록 착수.

**가드레일**: G1 시맨틱 커밋 — (1) `--v2-*` 포크+V2.0 보드, (2) exemplar 1장, (3) 이후 화면 패밀리별. G3 매 체크포인트마다: 원본 57 루트 `$--v2-*` 0건, 32 컴포넌트 원본 `--v2` 0건, V2 스코프 외 루트 diff 0건 검사. **위반 감지 → 작업 즉시 중단·보고.**
**복원**: V2 루트 전부 삭제 = 원본 상태(1단계). 원본 캔버스는 git 기준선 + 백업 본으로 이중 보존.

## Rollout & QA 계약

**Exemplar 단계 (사용자 확인 지점)**: 04.1 카피 → V2.1 제작(미리보기 확장) · 격리 재검증 · V2 다크 프리뷰 1장(ticket-deep 표면 확인) → QA1·2·7·9 통과 리포트 제시 → **사용자 확인 후에만 패밀리 롤아웃**. 순서: 04탭 → 05 만들기 → 06 학습 → 08 티켓 → 07 커뮤니티·설정 → 03 인증 → 09 상태(long-tail).

**PASS/FAIL (전 항목 충족 시에만 DONE)**:
- QA1 원본 57 루트 `$--v2-*` 참조 0건 · 속성 diff 0건
- QA2 32개 컴포넌트 정의의 `$--v2-*` 0건
- QA3 V2 텍스트 100% `$--type-*` 바인딩 + 크기 ≥11px
- QA4 4탭 셸 + 만들기 탭 잔재 0 + 홈 AI 엔트리 존재
- QA5 primary 블록 화면당 1개(모달 제출·폼 액션은 예외 목록과 일치)
- QA6 홈↔뷰어 히어로 카드 중복 0
- QA7 allowedPairs 대비 전부 충족(일반·pressed·disabled)
- QA8 390 bounds 클리핑 0(fit-content 42개 화면 포함 bounds 검사)
- QA9 상태 화면 7종 커버리지 유지
- QA10 '플로스' 오타 잔존 0
- QA11 Light/Dark 스크린샷 일괄 첨부

**승인 receipt**: `{ gate: "redesign-preset", selectedPreset: "coursebook", approvedByUser: true, scope: ["variables:v2-fork-8", "V2 roots: 04.1-04.4, 05.1-05.8, 06.1-06.4, 07.1-07.9, 08.1/08.2/08.6, 03.1-03.8, 09.1-09.6", "component overrides: instance-path only", "excluded: shared tokens, original 57 roots, web 10.1-10.3, dark 09.7-09.9"] }`
