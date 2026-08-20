# Arrow keys name where the tile travels, not where the gap travels

`ArrowRight` slides the tile immediately **left** of the gap rightward into it. The
arrow names the tile's direction of travel; the gap moves the opposite way.

Recorded because the inverse reading is equally coherent — an arrow naming which
neighbour of the gap you reach for — and roughly half of the sliding puzzles in the
wild pick it. Without the rationale written down, the polarity looks like a coin
flip and someone eventually "fixes" it. Left open by
[SLI-13](https://linear.app/sliding-puzzle/issue/SLI-13) and settled in
[SLI-32](https://linear.app/sliding-puzzle/issue/SLI-32).

## Considered options

- **The arrow names the tile's travel (chosen).** Consistent with the domain: a
  Move is "the relocation of one tile into the gap" (CONTEXT.md), so the tile is the
  subject and the gap is where it lands.
- **The arrow names the gap's travel**, i.e. the direction you reach to pick a tile.
  Rejected on announcements. Moves are announced per press — `ArrowLeft` produces
  "3 tiles moved left". Under this option the same keypress would announce "moved
  **right**", so every keyboard move would contradict its own confirmation in the
  screen reader. The option's usual justification is a gap treated as a cursor, and
  this board has no cursor: focus lives on tiles, not on the gap.

## Consequences

- `Direction` is a domain term (CONTEXT.md) and an engine type, and it always means
  the tile's direction. A future "move the gap" reading needs a different word, not a
  reinterpretation of this one.
- `cellForDirection(board, direction)` in the engine owns the mapping, so the
  polarity is stated once and asserted in the engine spec rather than restated in
  each component that binds a key.
- Arrow keys are an accelerator for the single adjacent move only. Multi-cell runs
  are reached by tabbing to any tile in the gap's row or column — every one of them
  is already a tab stop — so no modifier chord exists or is needed.
- Arrows are live screen-wide, not scoped to focus: while an interactive Board is
  mounted and no dialog is open, its `window`-level listener claims every unchorded
  arrow press ([SLI-71](https://linear.app/sliding-puzzle/issue/SLI-71)). Ctrl/⌘/Alt
  chords stay the browser's, an open dialog anywhere keeps all arrows, and at most
  one interactive Board mounts per screen.
