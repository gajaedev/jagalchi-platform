# RE0 Memo — V3 Web Cycle 3

## Objective

Clear the public Roadmap Viewer as a V3 black/white workspace without changing graph/editor data, ReactFlow ownership, viewer state, auth, analytics, exports, fork behavior, or AI behavior.

## Verdict

**Keep. The approved V3 web surface set—Home, Explore, Viewer, shared shell, theme, and font—is implemented.**

No `re0-work` restart is warranted. The shell restyle stayed CSS/accessibility-only and matched the baseline Viewer state lifecycle. Signed Home remains a separate auth-harness verification blocker, so the overall rollout receives no version label.

## Working assets that earned reuse

1. **CSS-first workspace chrome**
   - Header, toolbar, mode control, canvas plane, and sidebar now share the neutral V3 hierarchy without reparenting or reordering live workspace components.
   - Evidence: the source diff changed classes and missing accessibility attributes only.

2. **Explicit mode semantics**
   - Canvas/Card controls now expose mutually exclusive `aria-pressed` state.
   - Evidence: desktop browser tree reported `캔버스 pressed=true`, `카드 pressed=false`; switching modes retained the baseline lifecycle.

3. **Workspace state continuity probe**
   - The same five graph IDs loaded before and after the shell change and after cards→canvas.
   - Zoom changed from the baseline 1.272 transform to 1.5264, then returned to the existing fit-view transform after remount—matching pre-change behavior.
   - Mobile reload still selected cards and closed the sidebar; desktop load still selected canvas and opened it.

4. **Named icon and repeated actions**
   - Settings, sidebar close, and card-view actions now have unique accessible names.
   - Evidence: browser tree exposed `설정 메뉴`, `사이드바 닫기`, `HTML/CSS 기초 보기`, `JavaScript 보기`, and `React 보기`.

## Lessons

### L1 — File firewalls do not prove runtime preservation

A shell can break ReactFlow by changing ownership, measurement, or remount behavior without editing a node or graph source file.

- Evidence: adversarial review blocked structural recomposition until a CSS-only spike and before/after state probe were required.
- Gate: compare graph IDs, viewport transform, selection/detail lifecycle, mode transitions, sidebar lifecycle, and breakpoint behavior—not only diffs.

### L2 — Preserve the existing lifecycle, not an imagined better one

The current Viewer resets fit-view and selected detail when canvas remounts after card mode. This cycle was a visual contract, so it preserved that behavior rather than silently redesigning state persistence.

- Evidence: both baseline and final card→canvas transitions restored the 1.272 fit-view transform and cleared canvas detail.
- Gate: record baseline transitions before mutation; parity is judged against observed product behavior unless the user explicitly requests a behavior change.

### L3 — Accessibility names are part of visual hierarchy

Repeated `보기` controls made the card mode ambiguous even though the cards looked distinct. Naming actions by their associated node eliminated the same anti-pattern Cycle 1 found on Home.

- Evidence: initial mobile Viewer tree contained three `보기` buttons; final tree contained three unique node-specific names.
- Gate: every repeated row/card action includes its item identity in the accessible name.

### L4 — Toolbar scroll is valid; document overflow is not

The mobile Viewer toolbar intentionally scrolls horizontally while the document remains exactly 390px wide. This preserves all existing actions without shrinking them below usable sizes or wrapping the workspace chrome.

- Evidence: mobile screenshot showed clipped continuation inside the toolbar; document `scrollWidth === clientWidth === 390`.
- Gate: overflow must be contained by the intended toolbar scroller and never escape to the document.

## Anti-pattern corpus

### AP8 — Structural restyle disguised as shell cleanup

- Failure mode: reparenting canvas/sidebar for aesthetics remounts stateful workspace boundaries.
- Catch gate: CSS-only admission spike plus state-continuity comparison.

### AP9 — Source-diff preservation fallacy

- Failure mode: graph files remain untouched while runtime graph viewport or selection resets unexpectedly.
- Catch gate: compare live IDs, transforms, selected detail, and breakpoint lifecycle.

### AP10 — Repeated generic row actions

- Failure mode: every card exposes `보기`, producing an ambiguous accessibility tree and weak action hierarchy.
- Catch gate: item-qualified accessible names for every repeated action.

## Quality status

| Asset | Status | Evidence |
| --- | --- | --- |
| Viewer desktop workspace | Cleared | Real fixture, light/dark, 1440px, menus/modes/sidebar/zoom |
| Viewer mobile card mode | Cleared | 390px light/dark, cards/no sidebar, contained toolbar scroll |
| Viewer state continuity | Cleared | Same graph IDs and baseline-equivalent mode/zoom lifecycle |
| Viewer action semantics | Cleared | `aria-pressed`, named settings/close/card actions |
| Node/editor color contract | Preserved, not redesigned | No node/editor files changed |
| Signed Home | Not cleared | Existing MSW auth entry blocker remains |

## Verification evidence

- Focused Viewer component tests passed, including RoadmapHeader, ViewerSidebar, HeaderMenu, ZoomButtonGroup, and CardListMode.
- `pnpm lint`: passed.
- `pnpm build`: passed.
- Browser fixture: `/viewer/11111111-1111-4111-8111-111111111111`.
- Browser actions: settings, data export, image export, fork tree, canvas/cards, node detail, zoom, sidebar, breakpoint reload.
- Responsive/theme proof: 390px and 1440px, light and dark, no document overflow, Wanted Sans retained.
- Regression surfaces: `/login` rendered at 390px without overflow; guest `/tickets` preserved its existing auth redirect.

## Version decision

No version label is assigned. Home guest, Explore, Viewer, theme, shell, and font cleared their gates, but signed Home cannot clear until the auth/MSW entry path is repaired and driven through `/login`.

## Resolution

Cycle 4 repaired the Playwright server-mode contract and cleared Signed Home through `/login`; see `RE0-MEMO-20260831-V3-WEB-CYCLE-4.md`. The blocker and evidence above remain as the negative corpus that led to that fix.
