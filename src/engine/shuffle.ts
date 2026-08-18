import { applyMove, colOf, gapCell, isSolved, movesForCell, rowOf } from './board'
import type { Board, CellIndex, TileId } from './types'

/**
 * Walk length per cell — the single difficulty dial, kept here rather than at
 * call sites (ADR-0002).
 */
const SHUFFLE_MOVES_PER_CELL = 20

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
		const candidateCell = candidates[Math.floor(random() * candidates.length)]
		if (candidateCell === undefined) {
			break
		}
		const [move] = movesForCell(walked, candidateCell)
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
 */
export const shuffle = (board: Board, random: () => number): Board => {
	// A board with a single cell is all gap: the walk can never leave solved, so
	// re-walking it would spin forever.
	if (board.cells.length < 2) {
		return board
	}
	const steps = board.cells.length * SHUFFLE_MOVES_PER_CELL
	let shuffled = walk(board, random, steps)
	while (isSolved(shuffled)) {
		shuffled = walk(board, random, steps)
	}
	return shuffled
}
