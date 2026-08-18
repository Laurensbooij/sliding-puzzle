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
export const createBoard = (rows: number, cols: number): Board => {
	const lastCell = rows * cols - 1
	return {
		rows,
		cols,
		cells: Array.from({ length: rows * cols }, (_, cell) => (cell === lastCell ? GAP : cell)),
	}
}

/**
 * Walk length per cell — the single difficulty dial, kept here rather than at
 * call sites (ADR-0002).
 */
const SHUFFLE_MOVES_PER_CELL = 20

/** The cells orthogonally adjacent to the given one, i.e. one move away from it. */
const neighbourCells = (board: Board, cell: CellIndex): readonly CellIndex[] => {
	const row = rowOf(board, cell)
	const col = colOf(board, cell)
	return [
		row > 0 ? cell - board.cols : undefined,
		row < board.rows - 1 ? cell + board.cols : undefined,
		col > 0 ? cell - 1 : undefined,
		col < board.cols - 1 ? cell + 1 : undefined,
	].filter((neighbour) => neighbour !== undefined)
}

const walk = (board: Board, random: () => number, steps: number): Board => {
	let walked = board
	let lastMovedTile: TileId | undefined
	for (let step = 0; step < steps; step += 1) {
		const candidates = neighbourCells(walked, gapCell(walked)).filter(
			(cell) => walked.cells[cell] !== lastMovedTile,
		)
		// Only a board one cell wide can run out: everywhere else the gap has at
		// least two neighbours and the no-undo rule excludes at most one.
		const pressedCell = candidates[Math.floor(random() * candidates.length)]
		if (pressedCell === undefined) {
			break
		}
		const [move] = movesForCell(walked, pressedCell)
		if (move === undefined) {
			break
		}
		walked = applyMove(walked, move)
		lastMovedTile = move.tile
	}
	return walked
}

/**
 * Generates a starting board by walking from the solved board: a run of random
 * legal moves, never immediately undoing the previous one, re-walked if it
 * lands back on solved. Solvable by construction — see ADR-0002.
 *
 * The walk length is derived from the board's dimensions and governs
 * difficulty; keep it as one named constant here, not at call sites.
 */
export const shuffle = (board: Board, random: () => number): Board => {
	const steps = board.cells.length * SHUFFLE_MOVES_PER_CELL
	let shuffled = walk(board, random, steps)
	while (isSolved(shuffled)) {
		shuffled = walk(board, random, steps)
	}
	return shuffled
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
