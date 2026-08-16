# Sliding Puzzle

A sliding puzzle game: tiles are shuffled within a board and rearranged, one move at a
time, until the source image is reassembled.

"Puzzle" is the name of the project, not a term in the model. Never use it in code — it
resolves to at least three different concepts below.

## Language

**Board**:
The logical arrangement of tiles and the gap. Pure data — it has no appearance.
_Avoid_: grid, field

**Cell**:
One position on the board. Holds either a tile or the gap.
_Avoid_: slot, square, space

**Tile**:
A movable piece, carrying one fragment of the source image.
_Avoid_: block, piece, fragment

**Gap**:
The single cell holding no tile. Every move relocates a tile into it.
_Avoid_: blank, hole, empty

**Home cell**:
The cell a tile occupies on a solved board.
_Avoid_: target, correct position

**Move**:
The relocation of one tile into the gap. A single click may produce several moves when a
run of tiles shares a row or column with the gap.
_Avoid_: slide, shift

**Shuffle**:
Generating a starting board. Not every arrangement of tiles is reachable by legal moves,
so a shuffle must produce a solvable board.
_Avoid_: scramble, randomize

**Solvable**:
A board from which the solved board can be reached through legal moves.

**Solved**:
A board on which every tile sits in its home cell.
_Avoid_: complete, finished, won

**Frame**:
The chrome surrounding the board. Purely presentational — it holds no model state.
_Avoid_: container, tray, field

**Source image**:
The single artwork sliced across the tiles. Its reassembly is what makes the solved board
recognisable.
_Avoid_: picture, artwork, sprite

**Game**:
A board together with its move count and status.
_Avoid_: session, round, play
