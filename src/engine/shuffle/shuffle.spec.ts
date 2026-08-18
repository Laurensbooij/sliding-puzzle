import { describe, expect, it } from 'vitest'

import { createBoard, isSolved } from '../board/board'
import type { Board, TileId } from '../types'
import { GAP } from '../types'
import { shuffle } from './shuffle'

/** Seeded PRNG (mulberry32) so shuffle runs are repeatable — the engine takes randomness as an argument. */
const randomFrom = (seed: number): (() => number) => {
	let state = seed + 0x6d2b79f5
	return () => {
		state = (state + 0x6d2b79f5) | 0
		let drawn = Math.imul(state ^ (state >>> 15), 1 | state)
		drawn = (drawn + Math.imul(drawn ^ (drawn >>> 7), 61 | drawn)) ^ drawn
		return ((drawn ^ (drawn >>> 14)) >>> 0) / 4294967296
	}
}

const byTileOrder = (a: TileId | typeof GAP, b: TileId | typeof GAP): number =>
	(a ?? -1) - (b ?? -1)

const tilesAtHome = (board: Board): number =>
	board.cells.filter((tile, cell) => tile !== GAP && tile === cell).length

describe('shuffle', () => {
	const seeds = Array.from({ length: 50 }, (_, seed) => seed)

	it.each<[string, number, number]>([
		['3x3', 3, 3],
		['2x4', 2, 4],
		['4x4', 4, 4],
	])('never returns a solved %s board across seeded runs', (_case, rows, cols) => {
		const shuffled = seeds.map((seed) => shuffle(createBoard(rows, cols), randomFrom(seed)))
		expect(shuffled.every((board) => !isSolved(board))).toBe(true)
	})

	it('preserves the dimensions and the exact set of tiles plus one gap', () => {
		const solvedBoard = createBoard(3, 3)
		const shuffled = shuffle(solvedBoard, randomFrom(7))
		expect(shuffled.rows).toBe(3)
		expect(shuffled.cols).toBe(3)
		expect([...shuffled.cells].sort(byTileOrder)).toEqual(
			[...solvedBoard.cells].sort(byTileOrder),
		)
	})

	it('leaves the given board untouched', () => {
		const solvedBoard = createBoard(3, 3)
		const shuffled = shuffle(solvedBoard, randomFrom(3))
		expect(shuffled).not.toBe(solvedBoard)
		expect(solvedBoard.cells).toEqual([0, 1, 2, 3, 4, 5, 6, 7, GAP])
	})

	// The no-undo rule is what makes the walk mix; without it it oscillates in
	// place and leaves boards near-solved. See ADR-0002.
	it('walks far enough that barely a tile is left in its home cell', () => {
		const shuffled = seeds.map((seed) => shuffle(createBoard(3, 3), randomFrom(seed)))
		const averageAtHome =
			shuffled.reduce((total, board) => total + tilesAtHome(board), 0) / shuffled.length
		expect(averageAtHome).toBeLessThan(2)
	})

	it('leaves a board of a single cell alone — a walk can never take it off solved', () => {
		const singleCell = createBoard(1, 1)
		const shuffled = shuffle(singleCell, randomFrom(1))
		expect(shuffled).toEqual(singleCell)
	})

	it('is deterministic for a given random source', () => {
		const first = shuffle(createBoard(3, 3), randomFrom(11))
		const second = shuffle(createBoard(3, 3), randomFrom(11))
		expect(first.cells).toEqual(second.cells)
	})
})
