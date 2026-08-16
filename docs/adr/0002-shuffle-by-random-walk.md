# Shuffle by walking randomly from the solved board

Shuffling starts from the solved board and applies a run of random legal moves, never
immediately undoing the previous one, re-walking if it happens to land back on solved.
Every board is therefore solvable by construction rather than by check.

Recorded because the textbook approach is the opposite one, and someone will propose it:
tiles split into two parity classes that legal moves cannot cross, so a uniformly random
arrangement is unsolvable roughly half the time, and the standard fix is to count
inversions and swap two tiles to correct the class.

## Considered options

- **Permute, then correct parity.** Correct, and uniform across all solvable boards.
  Rejected: the parity rule is width-dependent and subtle — odd widths require an even
  inversion count, even widths couple it to the gap's row from the bottom — and that
  complexity buys a uniformity property a puzzle game has no use for.

## Consequences

- **Solvability is not computed anywhere**, so the engine exposes no `isSolvable`. If
  boards ever arrive from outside the app (a shared URL, a saved game), that guarantee
  disappears and the check has to come back.
- **The walk length governs difficulty** and has no principled value — it is a tuned
  constant derived from board dimensions. Keep it in one named, documented place in the
  engine rather than at call sites.
- **"Never immediately undo the last move" is load-bearing.** Without it the walk
  oscillates in place and short walks leave the board near-solved.
- Shuffle tests assert legality and non-solvedness over seeded runs, not solvability.
