# RE0 Memo — V3 Web Cycle 2

## Objective

Clear `/explore` as a real search-and-filter surface on the Cycle 1 V3 foundation without touching Viewer or inventing product data and controls.

## Verdict

**Keep and iterate in place. Do not use `re0-work`.**

Explore cleared the guest, URL-driven slice at 390px and 1440px in light and dark. Viewer is the next bounded surface. The full V3 web implementation remains unlabeled because Viewer and signed Home are not cleared.

## Working assets that earned reuse

1. **URL-derived control band**
   - Search value and active topic now derive from Next 16 async `searchParams`.
   - Browser evidence: submitting `백엔드` produced `/explore?q=백엔드`, retained the input value, and returned exactly one matching result.

2. **Single canonical result projection**
   - Featured and ordinary results come from one `roadmaps` array: item `0`, then `1…n`.
   - Browser evidence: after search and history navigation, one viewer href existed and the unique-href count was one; empty topic-filter state removed the featured result.

3. **Truthful control deletion**
   - Level, sort, and date controls were removed because the current API supports only search/tag and the previous controls had no URL/API effect.
   - Reuse: controls ship only when their state reaches the canonical query contract.

4. **Explore-aware mobile navigation**
   - Explore now has an active inverse mobile destination while existing destinations and the feature-flagged Career entry remain.
   - Browser evidence: accessibility state exposed both the active topic and active Explore navigation item.

## Lessons

### L1 — Data truth includes rank and lifecycle, not only field provenance

A featured card can use real fields and still be false if it is fetched separately, stale after URL changes, or duplicated below.

- Evidence: adversarial review blocked the first plan until featured and ordinary results were bound to one deduplicated URL-derived array.
- Gate: a promoted result must change, disappear, and restore with the same query/history transitions as the ordinary collection.

### L2 — Removing inert UI is progress

A polished control that does not alter state is worse than no control because it advertises a capability the product does not have.

- Evidence: source inspection showed level/sort/date controls were disconnected from `ExploreResults` and absent from `RoadmapListQuery`; they were deleted rather than visually restyled.
- Gate: every visible filter/sort control must produce observable URL state and an API request parameter supported by the contract.

### L3 — URL state must survive every control transition

Search and topic are one control band, not independent widgets. Changing one must preserve the other.

- Evidence: browser search produced `q=백엔드`; selecting `테스트` produced `q=백엔드&topic=테스트`; back navigation restored the filtered result and input.
- Gate: drive search → topic → back/forward → empty result and assert input, active chip, URL, and results agree at every step.

### L4 — Structural variety must follow role

The featured result earned a wider editorial composition because it is item zero in the canonical ordering; ordinary results use the compact grid. No cosmetic variants or extra data were generated.

- Evidence: 1440px capture showed a wide first result and compact ordinary result; 390px retained a linear readable stack.
- Gate: featured/ordinary distinction must disappear when there is no result and must never duplicate the same href.

## Anti-pattern corpus

### AP5 — Truthful fields, false selection

- Failure mode: a featured item is real but irrelevant, stale, or duplicated because it has a separate data path.
- Catch gate: one canonical array, deduplicated projection, query/history browser drive.

### AP6 — Capability theater controls

- Failure mode: sort/filter/date UI changes appearance but not URL, query key, or request.
- Catch gate: no control without an observable state-to-contract path.

### AP7 — Query-state amnesia

- Failure mode: selecting a topic drops the search, or a search submission resets the topic/input.
- Catch gate: combined `q` + `topic` transitions and back/forward restoration.

## Quality status

| Asset | Status | Evidence |
| --- | --- | --- |
| Explore URL control band | Cleared | Search/topic/history browser drive |
| Explore result projection | Cleared | Deduplicated href count; empty state removes feature |
| Explore responsive template | Cleared | 390/1440 light/dark; no horizontal overflow |
| Explore mobile nav state | Cleared | Active `aria-current` Explore item in browser |
| Viewer | Not evaluated | Cycle 3 only |
| Signed Home | Not cleared | Auth/MSW entry remains blocked |

## Verification evidence

- `pnpm lint`: passed.
- `pnpm build`: passed; `/explore` correctly became request-time rendered after async `searchParams` use.
- `pnpm test:run`: 153 files and 996 tests passed after Explore changes.
- Browser: 390×844 and 1440×1000, light/dark, no horizontal overflow.
- Browser interaction: search, topic empty state, back restoration, active URL/input/chips, deduplicated result hrefs.
