import type { Board, CellIndex, Direction, Move, TileId, TilePlacement } from '../types'
import { GAP } from '../types'

// Cell arithmetic, shared with ./shuffle. `rowOf` and `colOf` stay
// engine-internal — `index.ts` is what makes a name public, and they are not on
// it. `gapCell` is public: a renderer has to place the gap, and reading
// `cells` for it would go around `toPlacements` (engine.md).
export const rowOf = (board: Board, cell: CellIndex): number => Math.floor(cell / board.cols)

export const colOf = (board: Board, cell: CellIndex): number => cell % board.cols

export const gapCell = (board: Board): CellIndex => board.cells.indexOf(GAP)

/** Creates a solved board of the given dimensions, gap in the last cell. */
export const createBoard = (rows: number, cols: number): Board => {
	const lastCell = rows * cols - 1
	return {
		rows,
		cols,
		cells: Array.from({ length: rows * cols }, (_, cell) => (cell === lastCell ? GAP : cell)),
	}
}

/**
 * The moves produced by pressing the given cell: empty when the cell does not
 * share a row or column with the gap, otherwise one move per tile in the run
 * between the pressed cell and the gap (multi-slide, counted per tile).
 */
export const movesForCell = (board: Board, cell: CellIndex): readonly Move[] => {
	if (cell < 0 || cell >= board.cells.length) {
		return []
	}
	const gap = gapCell(board)
	const sameRow = rowOf(board, cell) === rowOf(board, gap)
	const sameCol = colOf(board, cell) === colOf(board, gap)
	if (cell === gap || (!sameRow && !sameCol)) {
		return []
	}

	const step = sameRow ? Math.sign(cell - gap) : Math.sign(cell - gap) * board.cols
	const moves: Move[] = []
	for (let from = gap + step; ; from += step) {
		const tile = board.cells[from]
		if (tile !== GAP && tile !== undefined) {
			moves.push({ tile, from, to: from - step })
		}
		if (from === cell) {
			break
		}
	}
	return moves
}

/**
 * The direction a move carried its tile — the inverse of `cellForDirection`,
 * and what a move announcement is phrased with (ADR-0014).
 */
export const directionOfMove = (board: Board, move: Move): Direction => {
	const step = move.to - move.from
	if (step === board.cols) {
		return 'down'
	}
	if (step === -board.cols) {
		return 'up'
	}
	return step > 0 ? 'right' : 'left'
}

/** Applies one legal move and returns the resulting board. */
export const applyMove = (board: Board, move: Move): Board => ({
	...board,
	cells: board.cells.map((tile, cell) =>
		cell === move.from ? GAP : cell === move.to ? move.tile : tile,
	),
})

/** Tiles currently able to move, i.e. sharing a row or column with the gap. */
export const movableTiles = (board: Board): readonly TileId[] =>
	board.cells.flatMap((tile, cell) =>
		tile !== GAP && movesForCell(board, cell).length > 0 ? [tile] : [],
	)

/** True when every tile sits in its home cell. */
export const isSolved = (board: Board): boolean =>
	board.cells.every((tile, cell) => tile === GAP || tile === cell)

/**
 * Derives the render projection: one entry per tile in stable tile order, so
 * DOM order never changes across moves and each tile animates from where it
 * was to where it now is.
 *
 * `homeCell` equals `tile` by definition — a tile is named after its home cell
 * — but the renderer reads a placement, not the identity rule, so it is spelled
 * out rather than inferred at each call site.
 */
export const toPlacements = (board: Board): readonly TilePlacement[] =>
	board.cells
		.flatMap((tile, cell) => (tile === GAP ? [] : [{ tile, cell, homeCell: tile }]))
		.sort((a, b) => a.tile - b.tile)

/**
 * The moves that turned one board into another — one per tile that changed
 * cell. Lets a renderer report what actually happened between two states
 * rather than what it asked for.
 */
export const movesBetween = (before: Board, after: Board): readonly Move[] => {
	const cellByTile = new Map(toPlacements(before).map(({ tile, cell }) => [tile, cell]))
	return toPlacements(after).flatMap(({ tile, cell }) => {
		const from = cellByTile.get(tile)
		return from === undefined || from === cell ? [] : [{ tile, from, to: cell }]
	})
}

/**
 * The cell holding the tile that travels `direction` into the gap — the
 * keyboard's half of a move (ADR-0014). The direction is the tile's, so the
 * named cell lies on the *opposite* side of the gap: `right` names the tile to
 * its left.
 *
 * Null when no such tile exists, which is the gap sitting against that edge.
 */
export const cellForDirection = (board: Board, direction: Direction): CellIndex | null => {
	const gap = gapCell(board)
	switch (direction) {
		// Guarded by column, not by index: cell `gap - 1` exists at the start of
		// every row but belongs to the row above.
		case 'right':
			return colOf(board, gap) > 0 ? gap - 1 : null
		case 'left':
			return colOf(board, gap) < board.cols - 1 ? gap + 1 : null
		case 'down':
			return rowOf(board, gap) > 0 ? gap - board.cols : null
		case 'up':
			return rowOf(board, gap) < board.rows - 1 ? gap + board.cols : null
	}
}
