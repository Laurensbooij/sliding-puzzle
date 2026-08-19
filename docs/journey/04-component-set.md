# 04 — Component set

**Status:** Done

## Goal

Build the components the puzzle needs. Document each one in Storybook.

## Screenshots

_Add Storybook shots to `assets/04-component-set/`. The Board mid-game, the Dialog open
over a blurred backdrop, and the Button/IconButton variant grids make good ones._

## How it went

The phase opened with a [Wayfinder map](https://linear.app/sliding-puzzle/issue/SLI-5)
rather than a backlog, because the space had too many interlocking open questions to cut
tickets against directly — token architecture, component boundaries, whether to take a
UI library, how to verify WCAG AA, how the game feature would adopt the design at all.

1. **Two research tickets ran first**, as `/research` subagents on throwaway branches,
   in parallel with nothing yet decided: headless component libraries (landed on
   hand-rolling everything) and Figma variable export tooling (landed on TokensBrücke).
2. **Five grilling tickets turned research into decisions**: component inventory and
   organization, token architecture and export workflow, external library stance,
   WCAG AA assurance strategy, and the game feature's adoption path.
3. **The map closed by cutting an 18-ticket backlog**, ordered with Linear's native
   blocking relations so the frontier was always exactly the unblocked set, each ticket
   carrying the WCAG acceptance checklist the strategy ticket had defined.
4. **Execution ran in waves of parallel agent sessions** once tickets unblocked: token
   cutover and the a11y gate stack first (everything else depended on both), then Icon,
   Tooltip, Tile adoption and the XState game machine, then a six-way wave — Badge,
   Card, StatCard, SegmentedControl, Switch, and the source-image registry — landing
   together. Six sessions building independently surfaced small inconsistencies (three
   different `className` idioms, ESLint not walking agent worktrees), cleaned up in one
   pass afterward rather than mid-build. A second wave built Select, Button and
   IconButton together; a third built Dialog and Board with Frame once their blockers
   cleared.

## Decisions

The load-bearing ones live in [docs/adr/](../adr/):
[design-system components are born shared](../adr/0009-design-system-components-are-born-shared.md),
[two-tier token sources](../adr/0010-two-tier-token-sources.md),
[no runtime UI dependencies](../adr/0011-no-runtime-ui-dependencies.md),
[state machines are born shared](../adr/0012-state-machines-are-born-shared.md),
[source images render inline, not as `<img>`](../adr/0013-source-images-render-inline-not-as-img.md),
and [arrow keys name the tile, not the gap](../adr/0014-arrow-keys-name-the-tile-not-the-gap.md).
The WCAG assurance strategy and its per-ticket checklist live in
[docs/conventions/accessibility.md](../conventions/accessibility.md).

What the ADRs don't record:

- **Renaming caught up with reality twice, mid-phase.** Figma's typography variables
  moved from `size/*` to `font-size/*`, and `StatTile` became **StatCard** everywhere in
  Figma. Claude Design — the prototyping surface, never canon — still lags on both and
  picks them up on its next manual sync.
- **Two Figma-side fixes stayed in the backlog on purpose**: a contrast rebind so filled
  accent/danger controls clear AA, and a glyph-size snap for Button/IconButton icons.
  Both are design corrections discovered while implementing, not implementation work
  themselves, so they wait for a design pass rather than blocking this one.
- **Component inventory research found only one candidate for a library**: Select (and
  marginally Tooltip) were the sole cases a headless library would have justified. Both
  got hand-rolled anyway — Select as a styled native `<select>` because the design
  specifies native-with-chrome, Tooltip on the Popover API — so the "no runtime UI
  dependencies" stance never had to make an exception.
- **The parallel-build waves were a deliberate bet**, not an accident of tooling: cutting
  the backlog by blocking relations made unblocked tickets provably independent, so
  building them in simultaneous agent sessions was safe. The one cost was consistency
  drift across sessions that never saw each other's code, paid down in a dedicated
  cleanup ticket rather than mid-flight.

## Next

The component set is done: 11 shared primitives, the game's `Tile`, `Board` and `Frame`,
the XState lifecycle machine, and the token/a11y pipeline they all sit on. Wiring them
into a playable page is Milestone 05 — Puzzle implementation — deliberately out of
scope here. Board and IconButton unblock
[Play screen composition](https://linear.app/sliding-puzzle/issue/SLI-33); Dialog
unblocks [Solved experience and the post-adoption VoiceOver pass](https://linear.app/sliding-puzzle/issue/SLI-34) —
both queued in the **Game screens** project.

## References

- Issues: [Design system implementation — wayfinder map](https://linear.app/sliding-puzzle/issue/SLI-5),
  [Design system implementation](https://linear.app/sliding-puzzle/project/design-system-implementation-5c919c477334) (project, 18 tickets)
- Commits: `85969ba`..`6acbf06`
