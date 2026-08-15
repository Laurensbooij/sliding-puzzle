# Shuffle by permuting, then correcting parity

Tiles split into two parity classes that legal moves cannot cross, so a uniformly random
arrangement is unsolvable roughly half the time. Shuffling therefore permutes freely,
counts inversions to determine the parity class, and swaps two non-gap tiles when the
class is wrong — plus a re-roll when the result lands on the solved board.

Recorded because the naive implementation looks correct, ships, and silently hands half
of all players a board they can never finish.

## Considered options

- **Random walk from solved** (apply K random legal moves, never immediately undoing the
  last). Solvable by construction and much simpler. Rejected: the resulting distribution
  is not uniform, and difficulty ends up governed by a magic K with no principled value.

## Consequences

- The parity rule depends on board width: odd widths require an even inversion count,
  even widths couple the inversion count to the gap's row counted from the bottom.
- `isSolvable` is part of the engine's public surface, so the property "every shuffled
  board is solvable" is directly testable over many seeded runs.
