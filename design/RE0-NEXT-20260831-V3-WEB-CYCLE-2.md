# RE0 Next — V3 Web Cycle 2

## Decision

**Iterate in place. Do not call `re0-work`.**

Cycle 1 produced reusable foundation modules and a quality-cleared guest Home template. The remaining work is application of those contracts, not a new architecture. Cycle 2 must not widen beyond Explore until Explore clears its real-surface gates.

## Thesis

Explore is a search-and-filter surface, not another Home dashboard. Its hierarchy is:

1. one search field,
2. a compact filter/sort control band,
3. one featured result only when existing data supports it,
4. a truthful result collection using the shared RoadmapCard.

Black/white inverse state communicates selection and the primary action. Cards remain neutral; category, progress, rating, duration, and level appear only when backed by current data.

Featured and ordinary results, if a featured treatment is used, MUST be one deduplicated projection of the same URL-derived result array: item `0` is featured and `1…n` are ordinary. A second fetch, curated fixture, or independent featured selector is forbidden.

## Preserve

- Wanted Sans local loader, hash, and OFL notice.
- V3 semantic theme spine and 2px contrasting focus behavior.
- Existing `/explore` query parsing, Suspense boundaries, search, filter, sort, analytics, and routes.
- `RoadmapCard` analytics privacy contract and progress normalization.
- Canonical shell and responsive max-width rhythm.
- Current career-evidence product vocabulary.
- The real query contract: `q` and `topic` feed `listPublicRoadmaps({ search, tag })`.

## Kill

- Blue/purple as brand, active filter, CTA, or AI identity.
- Literal white/black inside theme-aware primitive variants.
- Featured-card data invented from the `.pen` screenshot.
- A card around every label, filter, or metadata fragment.
- Duplicate accessible action names in the same result region.
- Cosmetic level/sort/date controls that do not change URL state or the API request. The current source renders these controls without wiring them to `ExploreResults`; preserving them would preserve misleading progress, not behavior.
- Internal-only review without browser evidence.

## Architecture vocabulary

- **Semantic inverse**: `primary` surface paired only with `primary-foreground`; no literal inverse paint.
- **Truthful metadata**: every visible datum traces to a current API/fixture/prop.
- **Control band**: search, filter, and sort form one hierarchy rather than separate dashboard modules.
- **Result spine**: one reusable result-card contract across featured and ordinary results; visual emphasis may change, semantics do not.
- **Primary scarcity**: one dominant action per viewport/section; navigation overlays do not compete with content CTA.
- **Surface proof**: browser-driven evidence at the artifact's actual route and target viewports.

## Hard gates

### Contract gates

1. Existing URL query/search/filter/sort behavior is unchanged.
2. Recommendation analytics still emit only the approved source payload and no content identifier.
3. No mock-only rating, learner count, duration, level, category, or progress is introduced.
4. Search, topic chip, result link, and featured action have unique accessible names and preserved keyboard behavior.
5. Featured and ordinary results are a single deduplicated projection of the final `q`/`topic` result array; the featured item changes or disappears with that array.
6. Only controls backed by URL state and the current API contract may ship. Adding sort/level/date behavior requires a separate API contract, not client-only theater.

### Visual gates

1. At 390px and 1440px, `scrollWidth === clientWidth`; clipping and overlap count is zero.
2. Light and dark screenshots show no blue/purple brand paint.
3. Search and inactive filters use neutral surfaces; active filters use semantic black/white inverse.
4. Every inverse control is visually checked in both themes, including hover/focus/pressed where browser automation can drive it.
5. Wanted Sans is the computed UI font and `document.fonts.check()` succeeds.
6. Normal text contrast is at least 4.5:1; control/focus cues are at least 3:1.

### Variety gate

Featured and ordinary results may differ in scale and composition, but they must not collapse into repeated same-shape cards with only text swapped. Structural variation must come from role: featured result, control band, result list/grid—not generated cosmetic variants.

### Regression gates

1. Run focused Explore unit/component tests.
2. Run lint and production build after browser artifacts are cleaned or excluded.
3. Drive `/explore` through actual search, filter, and sort interactions in the browser.
4. Record the existing auth/MSW E2E failure separately; do not claim signed-state clearance until `/login` reaches Home through the real harness.

## First build slice

Only `/explore` and the existing components it directly owns:

- page composition,
- search/filter/sort control band,
- featured/result presentation through existing RoadmapCard contracts,
- light/dark responsive browser QA.

Do not touch Viewer in the same lap. Viewer begins only after Explore clears every gate above.

## Version policy

- Do not label the whole V3 web implementation in Cycle 2.
- A version label may be assigned only to the Explore template and any reused primitive that passes its contract, visual, and regression gates.
- Signed Home remains unlabeled until the auth entry path is driven successfully.
