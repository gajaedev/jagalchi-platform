# RE0 Memo — V3 Web Cycle 4

## Objective

Clear the only remaining shipment gate: enter Signed Home through the real `/login` surface and verify the V3 composition at target widths and themes.

## Verdict

**SHIP the approved V3 web surface set.**

Signed Home now clears. The auth failures were not product-auth failures; the Playwright harness selected a production server whenever ambient `CI` was set, but reused a build compiled without public E2E mocking flags. Runtime `webServer.env` cannot change `NEXT_PUBLIC_*` values already inlined into that build.

No additional design surface or `re0-work` restart is justified.

## Working asset that earned reuse

### Explicit E2E server mode

Playwright now uses the development server by default and selects `next start` only when `E2E_USE_PRODUCTION_SERVER=true`. It also refuses to reuse an arbitrary server on port 3100.

- Evidence: the previously failing Auth/Home run changed from 8 failures / 11 passes to 19/19 passes.
- Evidence: a focused valid-login test passed before the full run.
- Reuse: tests that depend on inlined public environment flags must choose build/runtime mode explicitly, never infer it from generic ambient CI state.

## Lesson

### L1 — Build-time public flags make server selection part of the test contract

A production build compiled without `NEXT_PUBLIC_API_MOCKING=true` cannot be converted into an MSW build by passing that flag only to `next start`.

- Failure evidence: Playwright received `Failed to reach upstream`; manual development-server login returned `/api/users/auth/login` 200 and entered Home.
- Root cause: `process.env.CI` silently switched the harness to `next start`, coupling unrelated CI state to a build-time public flag contract.
- Gate: production-server E2E must be explicitly requested and built with the same public environment; ordinary E2E uses a fresh dev server and never reuses an unknown process.

## Anti-pattern corpus

### AP11 — Ambient-CI server selection

- Failure mode: generic `CI` changes the test server from dev to a stale or differently compiled production artifact.
- Catch gate: explicit E2E production-mode variable plus `reuseExistingServer: false`.

### AP12 — Runtime override of compile-time public configuration

- Failure mode: `NEXT_PUBLIC_*` is passed to `next start` after the bundle has already inlined a different value.
- Catch gate: build and serve with the same E2E environment, or use the dev compiler for the harness.

## Signed Home evidence

- `/login` accepted the MSW fixture account and navigated to `/`.
- Auth/Home E2E: 19/19 passed.
- Mobile 390px dark: signed hero, account-specific support actions, and mobile navigation rendered without horizontal overflow.
- Desktop 1440px dark/light: `scrollWidth === clientWidth`, Wanted Sans remained computed, profile state was authenticated, and action names were unique.
- Guest and signed variants now share the V3 hierarchy without invented progress or account metrics.
- Viewer fork-tree MSW route was aligned with the public API contract; the dialog loaded the real fixture title and owner instead of the previously observed upstream 502.

## Final quality status

| Asset | Status |
| --- | --- |
| Wanted Sans + provenance | Cleared |
| V3 semantic theme + inverse primitives | Cleared |
| Shared desktop/mobile shell | Cleared |
| Home guest | Cleared |
| Home signed | Cleared |
| Explore | Cleared |
| Viewer desktop/mobile | Cleared |
| Auth entry regression | Cleared |
| Viewer fork-tree QA contract | Cleared |

## Final verification

- Auth/Home Playwright: 19/19 passed.
- Unit suite: 153 files, 996 tests passed.
- ESLint: passed.
- Production build: passed.

## Version decision

The implemented Home, Explore, Viewer, shell, theme, font, and directly exercised primitives are eligible for a version label. No package or release version was changed because the user did not request repository versioning or a release operation.
