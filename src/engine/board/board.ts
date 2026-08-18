import type { Board, CellIndex, Move, TileId, TilePlacement } from '../types'
import { GAP } from '../types'

/** Thrown by every stub below until the implementation phase lands. */
const notImplemented = (fn: string): never => {
	throw new Error(`engine/${fn} is not implemented yet`)
}

// Cell arithmetic, shared with ./shuffle. Engine-internal: `index.ts` is what
// makes a name public, and these are not on it.
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
 * DOM order never changes across moves and tiles animate by transform alone.
 */
export const toPlacements = (_board: Board): readonly TilePlacement[] =>
	notImplemented('toPlacements')
