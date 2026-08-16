# 03 — Project setup

**Status:** Done

## Goal

Scaffold an AI-first React codebase. Conventions get enforced by tooling, not by review.

## Screenshots

_Add screenshots to `assets/03-project-setup/`. Storybook's first run and a custom lint rule firing both make good shots._

## How it went

The phase ran in three stages, deliberately in this order:

1. **Grill first, code never.** A long interview worked through the design tree in
   rounds — domain vocabulary, then the engine seam, then state, then tooling. Nothing
   was scaffolded until the frontier of open questions was empty.
2. **Write the decisions down as they landed**, into [CONTEXT.md](../../CONTEXT.md) and
   [docs/adr/](../adr/) — not afterwards from memory.
3. **Scaffold, then prove it.** The setup ends with one real component (`Tile`) carrying
   a story, a spec, tokens and a testid constant, because conventions nobody has
   exercised are conventions with unknown holes.

## Decisions

The load-bearing ones live in [docs/adr/](../adr/): the
[pure engine seam](../adr/0001-pure-engine-separate-from-react.md),
[shuffling by random walk](../adr/0002-shuffle-by-random-walk.md),
[XState for the game lifecycle](../adr/0003-game-lifecycle-on-an-xstate-machine.md),
[splitting docs by purpose](../adr/0004-conventions-split-by-purpose-not-audience.md),
[querying tests by accessible identity](../adr/0005-tests-query-by-accessible-identity.md),
and [generating tokens from Figma](../adr/0006-tokens-generated-from-figma-by-manual-export.md).

What the ADRs don't record:

- **Storybook stories as tests got adopted, then reversed.** Running stories through
  `@storybook/addon-vitest` in a real browser tests the accessibility tree far better
  than jsdom's approximation. It also drags Playwright into CI for a project with no
  E2E. Reverted to jsdom plus RTL specs; the addon is additive and can land later.
- **The custom lint plugin shrank from twelve candidate rules to a handful.** Everything else
  — arrow functions, file naming, a11y, Testing Library hygiene, the engine's import
  boundary — was already covered by maintained plugins or plain config.
- **One convention turned out impossible to enforce as asked.** A pre-commit hook cannot
  see the commit message, so "skip the checks for `CP` commits" can't be a hook decision.
  It became `pnpm cp`, an explicit `--no-verify` bypass, with the pre-push hook doing the
  real gatekeeping.
- **Two decisions were deliberately relegated** to implementation rather than settled
  here: the board-size range and the multi-slide move implementation. Both are cheap to
  reverse and neither changes a file, a boundary, or a lint rule.
- **A reversal proved the docs layout works.** Swapping the shuffle strategy touched
  seven files and left the glossary untouched, because vocabulary, rules, and rationale
  each live in exactly one place.

## Next

Components can be built against a working test and documentation loop, with the
conventions already enforced by lint rather than by review.

## References

- Issues: _add `SLI-x` links_
- Commits: `b50496d`, `069ce3d`
