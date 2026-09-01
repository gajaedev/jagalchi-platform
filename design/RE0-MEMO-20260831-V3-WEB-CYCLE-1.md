# RE0 Memo — V3 Web Cycle 1

## Objective

Move the web product toward `design/jagalchi-app-first.pen` V3 without replacing current routes, product meaning, auth, analytics, or data. This lap intentionally tested one complete vertical slice: global font/theme, shared shell, and Web Home.

## Verdict

**Keep the foundation and Home guest template; iterate in place. Do not use `re0-work`.**

The shared semantic spine, local font, shell, and guest Home survived real browser use at both target widths. The signed Home is implemented but is not quality-cleared because the existing MSW auth E2E path did not establish a signed-in session. Explore and Viewer remain outside this lap.

No version label is assigned. A label would incorrectly imply that signed Home and the remaining web surfaces cleared their gates.

## Working assets that earned reuse

1. **Semantic black/white spine**
   - Evidence: browser-computed dark body was `rgb(0, 0, 0)` / `rgb(255, 255, 255)`; light and dark screenshots showed the same hierarchy without blue/purple brand paint.
   - Reuse: `background`, `surface`, `muted`, `primary`, `primary-foreground`, `ticket`, focus ring, and compatibility aliases.

2. **Repository-bundled Wanted Sans contract**
   - Evidence: runtime `font-family` was `wantedSans, "wantedSans Fallback"`; `document.fonts.check()` returned true. The v1.0.3 WOFF2 hash and SIL OFL notice are local.
   - Reuse: local font asset, `next/font/local` loader, provenance notice. Do not return to system-installed-font assumptions.

3. **Single-primary Home composition**
   - Evidence: 1440×1000 and 390×844 browser captures showed one dominant hero followed by subordinate support and roadmap sections; `scrollWidth === clientWidth` at both widths.
   - Reuse: dominant hero + secondary rail/stack + restrained result cards. Preserve current career-evidence copy and routes rather than importing lesson data from the design mock.

4. **Canonical shell behavior**
   - Evidence: browser accessibility tree retained skip link, desktop navigation, search, theme control, notification/profile links, and mobile navigation. Keyboard focus produced a 2px contrasting ring with offset.
   - Reuse: canonical `/jagalchi.svg`, 1200px desktop alignment, mobile safe-area navigation, inverse active state.

## Lessons

### L1 — Semantic tokens are behavioral contracts, not a palette substitution

Changing `primary` from blue to black/white changes every component that combines semantic and literal colors. A primitive can compile, pass unit tests, and still invert twice in dark mode.

- Evidence: first dark browser capture exposed the Home inverse CTA using hard-coded `white` while dark `primary` was also white. The control lost the intended inverse relationship.
- General rule: every semantic role change requires auditing compound variants, opacity modifiers, hover/pressed states, and nested inverse surfaces.
- Next-cycle gate: render every touched primitive on `background`, `surface`, and `primary` in both themes before a page can clear.

### L2 — A responsive screenshot gate catches failures that tests cannot

The build, lint, and 996 unit tests did not expose the inverse CTA defect. Browser screenshots did, while width measurements proved that the same composition did not overflow.

- Evidence: desktop and mobile captures; computed 1440/1440 and 390/390 scroll/client widths.
- General rule: tests support the gate; they do not replace theme, typography, and responsive observation.
- Next-cycle gate: each surface needs screenshots at 390 and 1440, light and dark, plus computed font and overflow measurements.

### L3 — Truthful composition outranks screenshot-copy fidelity

The design canvas contains roadmap/lesson metrics that the product does not provide. Reusing the hierarchy while retaining current content produced a coherent Home without fabricated progress, ratings, duration, or learner counts.

- Evidence: Home uses existing career-evidence copy, feature flag, links, recommendation tracking, and only the existing roadmap fields.
- General rule: transfer visual hierarchy and component roles; never promote mock-only content into product data.
- Next-cycle gate: every displayed badge, metric, progress value, and category must trace to an existing prop/API/fixture.

### L4 — Signed-state clearance depends on a working entry path

A visually implemented authenticated state is not cleared when the browser cannot enter it through the real auth surface.

- Evidence: the focused Auth/Home Playwright run finished with 11 passing and 8 failing tests; failures clustered around MSW auth actions not producing responses/redirects, so `loginAsTestUser` never reached Home.
- General rule: do not infer signed-state quality from guest rendering or component code.
- Next-cycle gate: repair or isolate the MSW auth harness, then drive signed Home through `/login` before assigning any Home version label.

## Anti-pattern corpus

### AP1 — Literal inverse paint inside semantic primitives

- Failure mode: `white`/`black` literals combine with theme-dependent `primary`, producing same-on-same or unintended gray controls.
- Evidence case: dark Home inverse CTA before `Button` inverse variants were changed to `primary-foreground` / `primary`.
- Catch gate: computed foreground/background contrast for every inverse solid/outline/ghost variant in both themes; screenshot the primary surface.

### AP2 — Green tests used as visual approval

- Failure mode: component and build success hide contrast, hierarchy, clipping, or theme defects.
- Evidence case: 996 unit tests passed before browser QA found AP1.
- Catch gate: no visual template clears without browser proof at both target widths and themes.

### AP3 — Duplicate action vocabulary in one region

- Failure mode: several links with the same accessible name create strict-locator ambiguity and unclear action hierarchy.
- Evidence case: the first signed Home composition repeated `Career 열기` and `실행 과제 열기`; labels were made distinct while preserving hrefs.
- Catch gate: inspect the accessibility tree and require unique, intent-specific names for simultaneous actions.

### AP4 — Generated test output entering source lint scope

- Failure mode: Playwright report bundles create thousands of irrelevant lint errors and obscure product failures.
- Evidence case: the post-E2E lint encountered 1,124 errors from generated reports until those run artifacts were removed.
- Catch gate: clean or exclude generated report directories before source lint; never suppress product warnings to compensate.

## Quality status

| Asset | Status | Evidence |
| --- | --- | --- |
| Wanted Sans loader/provenance | Cleared | Runtime computed font + `document.fonts.check()` + local hash/OFL |
| V3 semantic theme spine | Cleared for Home/shell | Light/dark browser drive; no blue/purple brand paint observed |
| Shared shell guest behavior | Cleared | Desktop/mobile accessibility tree, focus ring, no overflow |
| Home guest template | Cleared | 390/1440, light/dark real-surface captures |
| Inverse Button variants | Cleared for observed Home usage | Light/dark re-drive + 37 focused variant tests |
| Signed Home template | Not cleared | Real auth entry blocked by existing MSW E2E failures |
| Explore / Viewer | Not evaluated | Outside Cycle 1 |

## Verification evidence

- `pnpm test:run`: 153 files, 996 tests passed before the final inverse-variant correction.
- Focused `variants.test.tsx`: 37 tests passed after the correction.
- `pnpm lint`: passed after generated test reports were removed.
- `pnpm build`: passed; `/`, `/explore`, `/viewer/[id]`, auth, and ticket routes compiled.
- Browser: 1440×1000 dark and 390×844 dark/light; no horizontal overflow; Wanted Sans loaded; 2px focus ring observed.
- Auth/Home Playwright: 11 passed, 8 failed in the MSW auth cluster. This is negative evidence, not a clearance.
