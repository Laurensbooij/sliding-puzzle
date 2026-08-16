---
paths:
  - 'src/engine/**'
---

# Engine conventions

The engine is the pure core: board rules, shuffling, move legality, solved detection.
See [ADR-0001](../adr/0001-pure-engine-separate-from-react.md).

## Hard boundary (lint-enforced)

- **No React, no XState, no DOM, no CSS imports.** `no-restricted-imports` blocks them.
- Anything the engine needs is an argument. It never reads context, globals, or stores.
- Randomness comes in as a `random: () => number` parameter — never `Math.random`
  directly — so tests can seed it.

## State shape

- The canonical board is a **permutation array**: `cells[cellIndex]` holds a `TileId`
  or `GAP`. Rules and adjacency math work on this form.
- The renderer never consumes `cells` directly — it uses `toPlacements`, the derived
  stable-identity projection. Keep that derivation pure and tested.

## Vocabulary

Use [CONTEXT.md](../../CONTEXT.md) terms exactly: Board, Cell, Tile, Gap, Home cell,
Move, Shuffle, Solvable, Solved. Never "puzzle" in code.

## Testing

- Engine specs are `*.spec.ts` beside the module, run in the **node** Vitest project —
  no DOM, no render.
- Property-style coverage over many seeded runs is the norm here. Solvability is
  structural, not checked (ADR-0002), so shuffle tests assert the walk applies only
  legal moves and never returns a solved board.
