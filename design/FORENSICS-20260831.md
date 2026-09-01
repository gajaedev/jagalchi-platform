# Jagalchi App-First — Design Forensics & Direction (2026-08-31)

> 상태: **Phase 1~3 완료 · 승인 게이트 대기 (USER_GATE)**
> 대상: `design/jagalchi-app-first.pen` (57 루트: DS 보드 + Gluestack 라이브러리 + 프로덕트 컴포넌트 라이브러리 + 모바일 51 + 웹 3 + 다크 3)
> 프로토콜: `i-hate-this-design` (QUALIFY → FORENSICS ✅ → PRESERVE_KILL ✅ → DIVERGE ✅ → PRESET_READY ⏳)
> 원칙: 읽기 전용. 화면 mutation 0건. 승인 전 제품 화면 수정 금지. 원본 파일 보존.

---

## 0. 리뷰 대상 정정 (중요)

이전 세션("Design review and fixes", 2026-08-31 00:33~00:54 KST)은 **이 워크스페이스에서 다른 프로젝트 파일**(`~/orca/projects/bungae-design/벙개_MVP.pen`, 벙개 앱)을 분석했다. 자갈치 리뷰는 2026-08-31 오전 세션에서 처음 수행함. 벙개 포렌식 결과는 별도 완료 — 본 문서는 자갈치 전용.

---

## 1. Forensics — 실측 (2026-08-31)

### 캔버스 구성
- `00 · Jagalchi Design System` — 원칙 3개, 시맨틱 컬러, 타이포 스케일(36/28/22/15/13), 스페이싱 4~48, 라디우스 8~full, 접근성 원칙
- `01 · Gluestack Component Library` — 버튼 6종, 폼, 선택, 내비, 웹 헤더/사이드바
- `02 · Product Component Library` — Roadmap 카드, Learning, Ticket, Feedback, Overlay 32종 컴포넌트
- 화면: 모바일 51 (03.x~09.x), 웹 3 (10.1~10.3), 다크 3 (09.7~09.9), 상태 7 (오프라인/404/만료/스켈레톤 등)

### 정량 실측

| 항목 | 값 | 판정 |
|---|---|---|
| fill 토큰 채택 | 779 토큰 / 27 raw (#FFFFFF 흰색 아이콘·라벨, #FFFFFFCC, 투명) | 양호 — raw는 전부 오버레이/반투명 합리적 사용 |
| **타이포 토큰 채택** | **443개 텍스트 전부 하드코딩 숫자, 토큰 0** | **결함 1** |
| 선언 스케일(36/28/22/15/13) 밖 사이즈 | **235개 (53%)** — 9·10·12·14·16·18·19·20·21·23·24·25·26·27·30·38 16종 분산 | **결함 1** |
| gap 분포 | 2·3·4·5·7·8·9·10·11·12·16·20 (7/9/11 = 손튜닝 흔적) | 간격 그리드 부재 |
| cornerRadius | 토큰(md 70, full 47, lg 30, xl 14, sm 5) + 리터럴 28(스크린 루트 51개 — 기기 프레임 모서리라 허용 범위) | 양호 |
| clipping / overlap / layout 문제 | **0건** | 양호 |
| 아이콘 | lucide 157개 100% 통일 | 양호 |
| 컴포넌트 채택 | Card/Roadmap ×22, 버튼 100+, 칩 ×61, 상태바 51화면 전부 ref | **우수 — 라이브러리가 장식 아님** |
| 스크린 높이 | 42/54 화면이 fit-content (390폭 고정, 높이 가변) | 설계 선택 — QA 시 bounds 확인 필요 |
| 앱바 | header형 9화면 중 4화면만 Mobile/App Bar ref, 나머지 커스텀 헤더 | 일관성 경계 |
| 웹 대응 | 모바일 51 : 웹 3 (홈·탐색·로드맵 상세) | 학습·티켓·AI·설정 웹 없음 |
| 다크 대응 | 토큰 44개 전부 Light/Dark 테마 바인딩 완료, 정작 다크 화면 3장뿐 (43장 미커버) | 셋업만, 제품 없음 |
| 대비 실측 | 화이트 on `--primary`(#3182F6) = **3.71:1** → 14px bold 버튼 라벨 AA 미달 / muted #6B7280 = 4.55:1 (아슬) | **접근성 결함** |
| 10px 텍스트 | 62곳 (통계 라벨, 프로그레스 요일 등) | 가독성 경계 |
| 오타/플레이스홀더 | Explore 피처드 카드 "앱 개발 **플로스**" | 사본 정리 필요 |

### 정성 결함 (root causes)

1. **타이포 시스템이 종이 위에만 존재** — DS 보드 선언과 화면 실제 분리. 스케일이 아니라 분포.
2. **"AI가 정체성"인데 AI가 시각적으로 아무것도 아님** — 유일한 수익 레이어(AI 티켓)가 일반 기능과 같은 카드+블루. `$--ticket` 퍼플은 14개 화면에 스킨처럼 뿌려질 뿐 "유료 AI 세계"의 위계가 없음.
3. **홈이 대시보드 덤프** — 인사+진행 레슨+목표+주간 통계+추천 5모듈 적층. "오늘 뭘 해주는 앱인가" 한 문장 답 없음. Learning Viewer가 같은 블루 "현재 레슨" 카드 복사 — 홈/뷰어 역할 분담 실패.
4. **웹 반제품** — app-first 의도라면 웹 헤더/사이드바 컴포넌트는 라이브러리에서 정리 대상.
5. **다크모드 셋업만** — 아키텍처 있고 제품 없음.
6. **5탭의 "만들기" 탭 의심** — 목적지가 아니라 티켓 게이트된 희소 액션. 센터+버튼 패턴 이식이 구조적으로 안 맞음.

### not_root_causes (문제 아님)
컴포넌트 채택률, lucide 통일, 구조적 결함 0건, 상태 커버리지. 블루 "색 자체"가 아니라 블루가 "전부"인 것이 문제.

```json
{
  "symptoms": ["generic Toss-style SaaS look", "dashboard-dump home", "AI features look identical to free features"],
  "root_causes": ["typography system exists only on the DS board", "no visual identity for the paid AI layer", "home IA has no single answer", "web/dark are scaffolds"],
  "not_root_causes": ["component adoption", "icon system", "state coverage", "structural defects"]
}
```

---

## 2. Preserve / Kill / Question

| PRESERVE | KILL | QUESTION |
|---|---|---|
| 32종 컴포넌트 라이브러리 + 높은 채택률, 44개 시맨틱 토큰 + Light/Dark 바인딩, lucide 통일, 5탭 중 탐색/활동/마이, 상태 화면 커버, 390 모바일 셸, 티켓 퍼플 존재 | 타이포 하드코딩 443개, 홈 5모듈 적층, 홈↔뷰어 현재-레슨 카드 중복, 웹 반제품 보드, 다크 3장 토큰 연극, 만들기 독립 탭, 블루 대형 블록 만능 패턴 | AI 티켓을 독립 세계로 키울지, 웹 끝까지 갈지/라이브러리에서 뺄지, 5탭 유지, 다크 출시 범위 |

KILL 비어있지 않음 → 프로토콜 유효.

---

## 3. Divergent directions (구조 3안)

### A · 코스북 (Coursebook) — **추천**
로드맵 = 교재. 홈 = "오늘 네 교재의 한 페이지". 진행 중 레슨이 풀블리드 주인공, 통계/추천은 여백으로. 학습 뷰어는 페이지 넘기기 메타포. 만들기는 탭에서 홈 진입점으로 흡수(4탭).
- layout: 단일 주인공 · typography: 6단 스케일 재정의 + 전면 토큰화
- risks: 대시보드 선호 유저 이탈 / 작업량 중간

### B · 코치 퍼스트 (Coach)
AI 코치가 홈. 대화 = 학습 세션. 로드맵은 대화에서 생성·수정, 티켓은 대화의 연료로 코치 화면 상시 미터링. 티켓 퍼플 = 유료 레이어의 세계.
- layout: chat-first + 플랜 레일
- risks: 대화 피로, 티켓 소진 시 빈 화면 경험, 티켓 economy 재설계 병행 필요 / 작업량 최대

### C · 기록 퍼스트 (Momentum)
오늘의 보드(스트릭·연속 기록·주간 그리드)가 홈. 로드맵은 트레일/맵 축소. Progress Dashboard가 앱의 심장.
- layout: 캘린더/그리드 지배
- risks: 내용보다 게이미피케이션 우선 노출 위험, 벙개에서 죽인 스코어보드 패턴 부활 경계 / 작업량 중간

---

## 4. 게이트 상태

- **redesign_depth 제안: `full`** (구조+비주얼 전면)
- **preservation_budget 제안**: product_logic strict / ia medium / components medium(라이브러리 보존) / visual_language low
- 다음 단계: 방향 선택(A/B/C/부분수정) → Phase 4 프리셋 합성(`RedesignPreset` 계약, 신규 문서 또는 신규 캔버스) → **승인 게이트** → exemplar 1~2장 → QA → rollout
**완료 기록 (2026-08-31 2차 세션)**: 방향 A 구조 프리셋 v2 합성 후 사용자 브랜딩 수정 요청 접수. `design/PRESET-coursebook-20260831.md`의 v3 유효 계약으로 전환 — **ROLLOUT_COMPLETE v3 · FULL_QA 구조/의도 통과 · product font gate 보류**. 기존 캔버스의 V2 보드·1장 비출하 미리보기는 유지하고, 원본과 분리된 V3 canvas `IqGIs`에 54개 product screen copy(모바일 51 + 웹 3, Dark 3 포함)를 배치했다. 신규 방향: `Jagalchi Core — Black / White SaaS` (기존 black-only mark, Wanted Sans, 검정/흰색 semantic primary, blue/purple brand 제거). Wanted Sans v1.0.3 한글 패키지를 로컬 설치했지만 Pencil 신규 exemplar는 family를 거부해 Noto Sans KR fallback으로 표시 중; product runtime computed-font/OFL notice gate 전에는 product shipment 불가. Kimi/Gemini 라우트는 세션 카탈로그 부재로 degraded — 방향 체크포인트는 본 문서 DIVERGE 출력으로 대체, 비평은 GJC critic(0-PresetCritic·1-MonoBrandCritic)으로 수행.
- **사용자 피드백 보정 (동일 세션)**: Home preview에서 개인화 greeting·장식용 상단 mark를 제거하고, `오늘의 학습`/`현재 레슨 · 2-2`만 기능 라벨로 남김. Hero는 246px → 215px로 축소(padding 20, gap 12, title 22). Mark는 preset board의 canonical specimen으로 이동. V3 exemplar에서 home/canvas problems 0, 원본 v2 누수 0, legacy brand paint 0 확인. Wanted Sans는 로컬 설치됐지만 Pencil fallback 상태라 실제 font QA는 아직 통과하지 않음.
- 승인 전 화면 mutation 금지. 부분수정 선택 시 일반 개선(impeccable) 워크플로로 라우팅.

## 증거
- 스크린샷: `/tmp/jagalchi-review/current*/` (주요 40+ 화면 + DS/Gluestack/Product 보드)
- 재현: `mcp__pencil_execute` Get/Export on `design/jagalchi-app-first.pen`
