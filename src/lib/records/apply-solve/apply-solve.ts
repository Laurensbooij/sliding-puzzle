import type { Records, Solve } from '../types'

/**
 * Folds a solve into the records. A new best is **strictly** fewer moves, so a
 * tie leaves the stored best — and the run that first reached it — untouched.
 * Pure: no React, no storage.
 */
export const applySolve = (records: Records, { boardSize, moveCount }: Solve): Records => {
	const currentBest = records.bests[boardSize]
	if (currentBest !== undefined && currentBest <= moveCount) return records

	return { ...records, bests: { ...records.bests, [boardSize]: moveCount } }
}
