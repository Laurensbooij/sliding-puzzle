import { BOARD_SIZES } from '@/lib/game-config'
import type { BoardSize } from '@/lib/game-config'
import { describe, expect, it } from 'vitest'

import { nextBoardSize } from './next-board-size'

describe('nextBoardSize', () => {
	it.each<[BoardSize, BoardSize]>([
		[3, 4],
		[4, 5],
		[5, 6],
	])('offers one step up from %i×%i', (boardSize, expected) => {
		const next = nextBoardSize(boardSize)
		expect(next).toBe(expected)
	})

	// The rule that keeps the action from ever having nothing to offer: the
	// largest board wraps rather than running out.
	it('wraps the largest size back to the smallest', () => {
		const next = nextBoardSize(6)
		expect(next).toBe(3)
	})

	it('names a size Setup offers, whatever it is given', () => {
		const offered = BOARD_SIZES.map(nextBoardSize)
		expect(offered.every((size) => BOARD_SIZES.includes(size))).toBe(true)
	})
})
