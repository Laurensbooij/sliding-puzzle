import { describe, expect, it } from 'vitest'

import type { Records, Solve } from '../types'
import { applySolve } from './apply-solve'

const recordsOf = (bests: Records['bests'] = {}): Records => ({ bests })

const solveOf = (overrides: Partial<Solve> = {}): Solve => ({
	gridSize: 3,
	moveCount: 40,
	...overrides,
})

describe('applySolve', () => {
	it('sets a best on the first solve at a size', () => {
		const records = applySolve(recordsOf(), solveOf({ gridSize: 4, moveCount: 120 }))

		expect(records.bests[4]).toBe(120)
	})

	it('replaces the best when the solve took strictly fewer moves', () => {
		const records = applySolve(recordsOf({ 3: 40 }), solveOf({ moveCount: 39 }))

		expect(records.bests[3]).toBe(39)
	})

	it('leaves the best untouched on a tie, so the first run to reach it keeps it', () => {
		const before = recordsOf({ 3: 40 })

		const after = applySolve(before, solveOf({ moveCount: 40 }))

		expect(after).toBe(before)
	})

	it('leaves the best untouched when the solve took more moves', () => {
		const before = recordsOf({ 3: 40 })

		const after = applySolve(before, solveOf({ moveCount: 41 }))

		expect(after).toBe(before)
	})

	it('keeps the bests recorded at other sizes', () => {
		const records = applySolve(recordsOf({ 3: 40, 5: 300 }), solveOf({ moveCount: 12 }))

		expect(records.bests).toEqual({ 3: 12, 5: 300 })
	})

	it('never mutates the records it was given', () => {
		const before = recordsOf({ 3: 40 })

		applySolve(before, solveOf({ moveCount: 10 }))

		expect(before.bests).toEqual({ 3: 40 })
	})
})
