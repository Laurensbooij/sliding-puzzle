# Responsive breakpoints are decided in JS, not CSS-only

A screen whose **layout changes shape** across a breakpoint branches in
TypeScript: `useMediaQuery` (`src/lib/use-media-query/`) subscribes to the
query, and the component returns one tree or the other. CSS keeps `@media` for
everything that only changes how a stable tree **looks**.

The breakpoint itself is one number, `--breakpoint-desktop`, declared in
`tokens/manual/breakpoints.json` as 768px and generated into
`src/styles/tokens.css` as `48rem` (ADR-0006, ADR-0010). `useIsDesktop()` reads
that custom property at runtime through `getComputedStyle` — CSS cannot accept a
`var()` inside a media condition, so a runtime read is the only way both sides
can share one declaration instead of restating the number in TypeScript. Motion
tokens are already read this way.

Recorded because a reader who goes looking for `@media` and finds `matchMedia`
deserves to know it was a decision.

## Considered options

- **Render both layouts and hide one with CSS.** The reflex answer, and the one
  this rejects. The Setup screen's two layouts each carry a full set of form
  controls, so a CSS-only split ships every radio twice: duplicate `id`s (invalid
  HTML, and `<label for>` then points at whichever came first), duplicate testids
  that make every query ambiguous, and a second radio group sharing the first
  one's `name`. The hidden copy also stays in the accessibility tree and the tab
  order unless each half is separately removed — at which point the "CSS-only"
  split has grown a JS branch anyway, just a less honest one.
- **Restate the number in TypeScript** (`const DESKTOP = 768`). Rejected: two
  declarations of one design decision, and nothing fails when they drift.
- **Container queries.** They keep responsiveness in CSS and scope it to a
  container rather than the viewport — genuinely better for a component that only
  restyles. They still cannot change a tree's shape, so they solve the other half
  of the problem, not this one.

## Consequences

- **Layout depends on JS.** Acceptable here only because this is a client-rendered
  SPA: without JS there is no app at all, so the branch adds no failure mode that
  did not already exist. A project that server-renders would have to revisit this.
- **A tree can change shape mid-session**, on resize or an orientation flip. The
  swapped-out subtree unmounts: its local state is gone and focus lands on
  `<body>`. **State that must survive the crossover lives above the branch** — in
  a provider or a machine, never inside one of the two layouts.
- **The mobile branch is the fallback.** Queries are `min-width`, so `false` — the
  first-paint value, and the value when the token is missing — means mobile. A
  stylesheet that failed to load degrades to the narrow layout rather than to one
  built for a width nobody has.
- **jsdom ships no `matchMedia` at all** — not a stub. Specs run against the fake
  in `src/testing/match-media.ts`, installed globally from `vitest.setup.ts`; it
  treats a query string as an opaque key and parses nothing, so whether a browser
  reads `(min-width: 48rem)` the way we expect stays a Chromium question.
- Adding a breakpoint means adding a token, not a constant. `tokens/manual/` is
  the hand-owned tier because Figma has no variable for a breakpoint.
