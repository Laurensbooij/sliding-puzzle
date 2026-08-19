# Design-system components are born shared in `src/components/`

Components defined by the Figma design system skip the colocation ladder: they
start in a shared tier, with colocated Storybook stories as their acceptance
surface. There are two such tiers, split by one question — could this component
render unchanged in a different product? Yes → `src/components/`, reached as
`@components/<Name>`. No → `src/widgets/`, reached as `@widgets/<Name>`.

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

## Amended: the split was always generic-vs-domain

This ADR parked "Board, Tile, Frame — game feature" for want of a home, not
because a feature was the right tier for them. Board has two screen consumers —
Play renders it live, Setup's home-preview mounts the same component — and a
domain component shared across screens had nowhere to sit. `src/widgets/` is that
home, and the admission test is the one already implied above:

**Could this component render unchanged in a different product?**

- **Yes → `src/components/`.** Button, Dialog, Switch, Tooltip. Generic UI: the
  props carry no Sliding Puzzle vocabulary.
- **No → `src/widgets/`.** Board names Tiles and Gaps, AppHeader carries this
  app's brand and routes, Settings knows these three toggles. None of them ships
  elsewhere.

The ladder still runs inside the tier: a component used by exactly one feature
stays in that feature regardless of which answer it gives. `Solved` is
product-specific but Play-only, so it stays in `features/play`.

Widgets sit between components and features in the flow and are subject to the
same sideways ban features carry — see
[ADR-0007](./0007-module-boundaries-and-import-aliases.md) for the alias and the
enforced zones.

## Considered options

- **Strict ladder: build inside `src/features/game/`, promote later.** Rejected:
  most primitives serve screens that are not built yet, so they would sit in the
  wrong home from day one and every future screen pays a promotion tax.
- **A separate design-system package/workspace.** Rejected: one app consumes it;
  a package boundary adds versioning ceremony with no second consumer to serve.

## Consequences

- `@components/*` and `@widgets/*` are glob aliases (`@components/Button`,
  `@widgets/Board`), unlike the single-module aliases — each folder is its own
  module with an `index.ts` barrel; there is no tree barrel to alias to.
- The import flow gains two layers:
  `engine → lib → components → widgets → features → app` (the ESLint zones
  enforce both positions).
- Colocated stories are mandatory in **both** shared tiers (lint-enforced:
  `sliding-puzzle/stories-file-required`); Storybook is where a component's
  variants are visually accepted against Figma.
