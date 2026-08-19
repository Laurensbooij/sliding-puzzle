import type { Records, Solve } from '../types'

/**
 * The rule, in one place: a new best is **strictly** fewer moves than the best
 * a size already holds, and the first solve at a size is one — it has nothing
 * to tie with. A tie is not a best, so the run that first reached it keeps it.
 *
 * Exported because the write is not the only reader: the screen that records a
 * solve also has to say whether it was a record, and it asks *before* writing.
 */
export const isNewBest = (moveCount: number, currentBest: number | undefined): boolean =>
	currentBest === undefined || moveCount < currentBest

/** Folds a solve into the records. Pure: no React, no storage. */
export const applySolve = (records: Records, { boardSize, moveCount }: Solve): Records => {
	if (!isNewBest(moveCount, records.bests[boardSize])) return records

	return { ...records, bests: { ...records.bests, [boardSize]: moveCount } }
}
