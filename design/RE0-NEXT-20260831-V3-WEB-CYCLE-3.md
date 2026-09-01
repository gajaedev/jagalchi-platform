# RE0 Next — V3 Web Cycle 3

## Decision

**Iterate in place. Do not call `re0-work`.**

Cycle 3 is a viewer-shell restyle on the proven semantic foundation. It must not redesign the roadmap graph data, node color contract, editor behavior, auth, fork semantics, exports, or AI coach.

The first implementation MUST be CSS/class and accessibility-state only. Do not reparent, reorder, conditionally remount, or replace the ReactFlow provider, canvas, card list, sidebar, or toolbar ownership boundaries.

## Thesis

Viewer is a workspace, not a collection of cards. The hierarchy is:

1. restrained roadmap header with identity and authenticated actions,
2. one compact toolbar for menus and layout mode,
3. a dominant canvas/card-list work area,
4. one subordinate detail/progress sidebar.

Black/white semantic contrast distinguishes chrome from content. Existing roadmap node colors remain product/editor data and are outside this visual lap.

## Preserve

- `useViewerRoadmapLoader`, viewer atoms, ReactFlow provider, and analytics.
- Back, fork, AI coach, export, save-image, fork-tree, layout toggle, sidebar, zoom, selection, resource, and completion behavior.
- Mobile behavior that enters card layout and closes the sidebar below 768px.
- Existing roadmap graph nodes, edges, snap grid, fit view, and node/editor colors.
- Error/loading truth and the public fixture route.

## Kill

- Generic bordered-card treatment on every workspace region.
- Blue/purple shell/chrome paint introduced outside roadmap node data.
- Repeated primary buttons in the toolbar.
- Literal theme colors inside inverse or selected states.
- Changes to graph/editor contracts disguised as visual cleanup.
- Declaring the Viewer cleared from a static screenshot without driving controls.

## Architecture vocabulary

- **Workspace chrome**: header, toolbar, mode controls, zoom, and sidebar boundaries; neutral and subordinate to content.
- **Content plane**: ReactFlow canvas or card-list mode; the dominant working surface.
- **Mode exclusivity**: exactly one of canvas/cards is selected and expressed with semantic inverse state.
- **Sidebar lifecycle**: open/close and selected-node detail remain one interaction contract.
- **Editor-color firewall**: shared theme may affect chrome; roadmap node color constants are not changed in this lap.
- **Interaction proof**: drive, do not infer, every retained workspace action relevant to changed files.

## Hard gates

### Contract gates

1. Viewer loads a real public fixture at `/viewer/11111111-1111-4111-8111-111111111111` under MSW.
2. Canvas/cards toggles change the visible content mode and preserve exactly one selected state.
3. Sidebar open/close works; selecting a node updates detail without changing graph data.
4. Export/save-image/fork-tree menu triggers still open their existing surfaces.
5. Guest fork remains disabled; no auth or analytics payload changes.
6. No node, edge, graph, or editor-color source is modified.
7. In one browser session, select a node, change zoom, open/close the sidebar, switch canvas → cards → canvas, and cross the 768px breakpoint. Graph IDs/data, ReactFlow ownership, selection/detail state where the current product preserves it, and breakpoint behavior must match the baseline.

### Visual gates

1. At 390px and 1440px, horizontal overflow, clipping, and overlap are zero.
2. Header, toolbar, content plane, and sidebar share the V3 neutral hierarchy in light and dark.
3. Viewer chrome has no blue/purple brand paint; roadmap data colors are explicitly exempt.
4. Long Korean titles/descriptions remain visible or intentionally truncated with accessible names.
5. Mode, sidebar, menu, and zoom controls retain 2px focus-visible treatment.
6. Wanted Sans remains the computed UI font.

### Scope gate

Only CSS/classes and missing accessibility state on the Viewer shell and its direct header/sidebar/canvas boundaries may change. DOM ownership and ordering remain unchanged. Node renderers, graph schema, loaders, stores, hooks, editor code, and modal internals remain untouched unless real-surface evidence proves a direct regression from the shell change.

## First build slice

- `RoadmapViewer` visual hierarchy without reparenting or reordering.
- `RoadmapHeader` neutral action hierarchy.
- `ViewerSidebar` surface/boundaries/focus.
- `ViewerCanvas` content-plane boundary.
- Missing toolbar/menu labels and `aria-pressed` state directly exposed by the changed shell.

Do not redesign menu internals, node components, CardList content, or AI modal in this lap.

## Version policy

Viewer receives no label until the real fixture loads and mode/sidebar/menu interactions clear at both target widths and themes. The overall V3 web rollout remains unlabeled until signed Home is also entered through a working auth harness.
