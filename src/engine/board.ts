import type { Board, CellIndex, Move, TileId, TilePlacement } from './types'
import { GAP } from './types'

/** Thrown by every stub below until the implementation phase lands. */
const notImplemented = (fn: string): never => {
	throw new Error(`engine/${fn} is not implemented yet`)
}

const rowOf = (board: Board, cell: CellIndex): number => Math.floor(cell / board.cols)

const colOf = (board: Board, cell: CellIndex): number => cell % board.cols

const gapCell = (board: Board): CellIndex => board.cells.indexOf(GAP)

/** Creates a solved board of the given dimensions, gap in the last cell. */
export const createBoard = (_rows: number, _cols: number): Board => notImplemented('createBoard')

/**
 * Generates a starting board by walking from the solved board: a run of random
 * legal moves, never immediately undoing the previous one, re-walked if it
 * lands back on solved. Solvable by construction — see ADR-0002.
 *
 * The walk length is derived from the board's dimensions and governs
 * difficulty; keep it as one named constant here, not at call sites.
 */
export const shuffle = (_board: Board, _random: () => number): Board => notImplemented('shuffle')

/**
 * The moves produced by pressing the given cell: empty when the cell does not
 * share a row or column with the gap, otherwise one move per tile in the run
 * between the pressed cell and the gap (multi-slide, counted per tile).
 */
export const movesForCell = (board: Board, cell: CellIndex): readonly Move[] => {
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
export const movableTiles = (board: Board): readonly TileId[] => {
	const gap = gapCell(board)
	return board.cells.filter(
		(tile, cell): tile is TileId =>
			tile !== GAP &&
			(rowOf(board, cell) === rowOf(board, gap) || colOf(board, cell) === colOf(board, gap)),
	)
}

/** True when every tile sits in its home cell. */
export const isSolved = (_board: Board): boolean => notImplemented('isSolved')

/**
 * Derives the render projection: one entry per tile in stable tile order, so
 * DOM order never changes across moves and tiles animate by transform alone.
 */
export const toPlacements = (_board: Board): readonly TilePlacement[] =>
	notImplemented('toPlacements')
