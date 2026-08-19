import { describe, expect, it } from 'vitest'

import { formatElapsedTime, formatMoveCount } from './format-stats'

const SECOND_MS = 1000
const MINUTE_MS = 60 * SECOND_MS

describe('formatMoveCount', () => {
	it.each([
		[0, '00'],
		[7, '07'],
		[42, '42'],
	])('pads %i to two digits', (moveCount, expected) => {
		const formatted = formatMoveCount(moveCount)

		expect(formatted).toBe(expected)
	})

	it.each([
		[99, '99'],
		[100, '100'],
		[142, '142'],
	])('lets %i grow past two digits rather than capping it', (moveCount, expected) => {
		const formatted = formatMoveCount(moveCount)

		expect(formatted).toBe(expected)
	})
})

describe('formatElapsedTime', () => {
	it.each([
		[0, '00:00'],
		[7 * SECOND_MS, '00:07'],
		[MINUTE_MS + 18 * SECOND_MS, '01:18'],
	])('reads %ims as mm:ss', (elapsed, expected) => {
		const formatted = formatElapsedTime(elapsed)

		expect(formatted).toBe(expected)
	})

	it('drops the part of a second that has not finished', () => {
		const formatted = formatElapsedTime(7 * SECOND_MS + 999)

		expect(formatted).toBe('00:07')
	})

	/** The whole point of the format: no hours field, ever. */
	it('keeps counting minutes past an hour instead of rolling over', () => {
		const formatted = formatElapsedTime(101 * MINUTE_MS + 23 * SECOND_MS)

		expect(formatted).toBe('101:23')
	})
})
