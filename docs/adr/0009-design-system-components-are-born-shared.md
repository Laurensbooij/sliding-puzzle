# Design-system components are born shared in `src/components/`

Components defined by the Figma design system skip the colocation ladder: they
start in `src/components/`, reached as `@components/<Name>`, with colocated
Storybook stories as their acceptance surface. Game-domain components (Board,
Tile, Frame) stay in `src/features/game/` — they carry domain vocabulary, not
generic UI.

Recorded because it contradicts two standing rules on their face:
"colocate by default; promote on the 2nd consumer" (CLAUDE.md), and ADR-0007's
"`@components` does not exist while the shared tier is empty". Both rules guard
against **speculative** sharing. A design system is not speculation: its
consumers are designed screens that exist in Figma (Setup, Play, Solved,
Records, Settings), and its components are specified there before any feature
asks for them. Waiting for a second code consumer would just route every
component through a pointless feature-local phase and a rename-heavy promotion.

## What counts as a design-system component

A component that exists in the Figma design system's component set. Everything
else still climbs the ladder. The inventory at the time of this decision:
Badge, Button, Card, Dialog, Icon, IconButton, SegmentedControl, Select,
StatCard, Switch, Tooltip — shared; Board, Tile, Frame — game feature.

## Considered options

- **Strict ladder: build inside `src/features/game/`, promote later.** Rejected:
  most primitives serve screens that are not built yet, so they would sit in the
  wrong home from day one and every future screen pays a promotion tax.
- **A separate design-system package/workspace.** Rejected: one app consumes it;
  a package boundary adds versioning ceremony with no second consumer to serve.

## Consequences

- `@components/*` is a glob alias (`@components/Button`), unlike the
  single-module aliases — each component folder is its own module with an
  `index.ts` barrel; there is no tree barrel to alias to.
- The import flow gains a layer: `engine → lib → components → features → app`
  (the ESLint zones already enforced this position).
- Colocated stories are mandatory in the shared tier (lint-enforced:
  `sliding-puzzle/stories-file-required`); Storybook is where a component's
  variants are visually accepted against Figma.
