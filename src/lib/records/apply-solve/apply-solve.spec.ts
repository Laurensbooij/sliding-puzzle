import { describe, expect, it } from 'vitest'

import type { Records, Solve } from '../types'
import { applySolve, isNewBest } from './apply-solve'

const recordsOf = (bests: Records['bests'] = {}): Records => ({ bests })

const solveOf = (overrides: Partial<Solve> = {}): Solve => ({
	boardSize: 3,
	moveCount: 40,
	...overrides,
})

describe('applySolve', () => {
	it('sets a best on the first solve at a size', () => {
		const records = applySolve(recordsOf(), solveOf({ boardSize: 4, moveCount: 120 }))

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

/**
 * The same rule the fold above is built on, read on its own by whoever has to
 * answer the question before the write lands.
 */
interface BestCase {
	solve: string
	moveCount: number
	currentBest: number | undefined
	expected: boolean
}

describe('isNewBest', () => {
	it.each<BestCase>([
		{
			solve: 'the first solve at a size',
			moveCount: 40,
			currentBest: undefined,
			expected: true,
		},
		{
			solve: 'a solve in strictly fewer moves',
			moveCount: 39,
			currentBest: 40,
			expected: true,
		},
		{ solve: 'a tie', moveCount: 40, currentBest: 40, expected: false },
		{ solve: 'a longer solve', moveCount: 41, currentBest: 40, expected: false },
	])('answers $expected for $solve', ({ moveCount, currentBest, expected }) => {
		expect(isNewBest(moveCount, currentBest)).toBe(expected)
	})
})
