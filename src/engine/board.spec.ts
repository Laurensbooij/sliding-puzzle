import { describe, expect, it } from 'vitest'

import { applyMove, createBoard, isSolved, movableTiles, movesForCell, shuffle } from './board'
import type { Board, CellIndex, TileId } from './types'
import { GAP } from './types'

const boardOf = (rows: number, cols: number, cells: readonly (TileId | typeof GAP)[]): Board => ({
	rows,
	cols,
	cells,
})

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

// 3x3, gap in the centre (cell 4).
const gapCentre = boardOf(3, 3, [0, 1, 2, 3, GAP, 4, 5, 6, 7])

// 3x3, gap at the end of the top row (cell 2).
const gapTopRight = boardOf(3, 3, [3, 5, GAP, 0, 1, 2, 4, 6, 7])

// 2x4, gap at the end of the top row (cell 3) — non-square, so row/col
// arithmetic mix-ups surface.
const gapWideBoard = boardOf(2, 4, [4, 0, 6, GAP, 1, 5, 2, 3])

describe('movesForCell', () => {
	it.each<[string, Board, CellIndex]>([
		['the cell shares neither row nor column with the gap', gapCentre, 0],
		['the pressed cell is the gap itself', gapCentre, 4],
		['the cell is diagonal to the gap on a non-square board', gapWideBoard, 6],
		['the cell lies beyond the board yet aligns with the gap column', gapCentre, 10],
		['the cell index is negative', gapCentre, -3],
	])('produces no moves when %s', (_case, board, cell) => {
		const moves = movesForCell(board, cell)
		expect(moves).toEqual([])
	})

	it('produces a single move for a tile beside the gap in the same row', () => {
		const moves = movesForCell(gapCentre, 3)
		expect(moves).toEqual([{ tile: 3, from: 3, to: 4 }])
	})

	it('produces a single move for a tile above the gap in the same column', () => {
		const moves = movesForCell(gapCentre, 1)
		expect(moves).toEqual([{ tile: 1, from: 1, to: 4 }])
	})

	it('produces one move per tile in a row run, gap-adjacent tile first', () => {
		const moves = movesForCell(gapTopRight, 0)
		expect(moves).toEqual([
			{ tile: 5, from: 1, to: 2 },
			{ tile: 3, from: 0, to: 1 },
		])
	})

	it('produces one move per tile in a column run, gap-adjacent tile first', () => {
		const moves = movesForCell(gapTopRight, 8)
		expect(moves).toEqual([
			{ tile: 2, from: 5, to: 2 },
			{ tile: 7, from: 8, to: 5 },
		])
	})

	it('spans a full-width run on a non-square board', () => {
		const moves = movesForCell(gapWideBoard, 0)
		expect(moves).toEqual([
			{ tile: 6, from: 2, to: 3 },
			{ tile: 0, from: 1, to: 2 },
			{ tile: 4, from: 0, to: 1 },
		])
	})

	it('yields a run that is legal move by move and leaves the gap on the pressed cell', () => {
		const pressedCell: CellIndex = 0
		const moves = movesForCell(gapWideBoard, pressedCell)
		const finalBoard = moves.reduce((board, move) => {
			expect(board.cells[move.to]).toBe(GAP)
			expect(board.cells[move.from]).toBe(move.tile)
			return applyMove(board, move)
		}, gapWideBoard)
		expect(finalBoard.cells[pressedCell]).toBe(GAP)
	})
})

describe('applyMove', () => {
	it('relocates the tile into the gap and leaves the gap on the vacated cell', () => {
		const result = applyMove(gapCentre, { tile: 3, from: 3, to: 4 })
		expect(result.cells).toEqual([0, 1, 2, GAP, 3, 4, 5, 6, 7])
	})

	it('preserves the board dimensions', () => {
		const result = applyMove(gapCentre, { tile: 3, from: 3, to: 4 })
		expect(result.rows).toBe(3)
		expect(result.cols).toBe(3)
	})

	it('returns a new board and leaves the given board untouched', () => {
		const result = applyMove(gapCentre, { tile: 1, from: 1, to: 4 })
		expect(result).not.toBe(gapCentre)
		expect(gapCentre.cells).toEqual([0, 1, 2, 3, GAP, 4, 5, 6, 7])
	})
})

describe('movableTiles', () => {
	it.each<[string, Board, TileId[]]>([
		['the gap sits in the centre', gapCentre, [1, 3, 4, 6]],
		['the gap sits in a corner', gapTopRight, [2, 3, 5, 7]],
		['the board is non-square', gapWideBoard, [0, 3, 4, 6]],
	])(
		'lists every tile sharing a row or column with the gap when %s',
		(_case, board, expected) => {
			const tiles = movableTiles(board)
			expect([...tiles].sort((a, b) => a - b)).toEqual(expected)
		},
	)

	it('agrees with movesForCell across every cell of the board', () => {
		const movable = movableTiles(gapWideBoard)
		gapWideBoard.cells.forEach((tile, cell) => {
			const moves = movesForCell(gapWideBoard, cell)
			if (tile === GAP) {
				expect(moves).toEqual([])
			} else if (movable.includes(tile)) {
				expect(moves.length).toBeGreaterThan(0)
			} else {
				expect(moves).toEqual([])
			}
		})
	})
})

describe('createBoard', () => {
	it('places every tile in its home cell and the gap in the last cell', () => {
		const board = createBoard(3, 3)
		expect(board.cells).toEqual([0, 1, 2, 3, 4, 5, 6, 7, GAP])
	})

	it('carries the given dimensions on a non-square board', () => {
		const board = createBoard(2, 4)
		expect(board).toEqual(boardOf(2, 4, [0, 1, 2, 3, 4, 5, 6, GAP]))
	})
})

describe('isSolved', () => {
	it.each<[string, Board]>([
		['every tile sits in its home cell', createBoard(3, 3)],
		['the board is non-square and solved', createBoard(2, 4)],
	])('is true when %s', (_case, board) => {
		const solved = isSolved(board)
		expect(solved).toBe(true)
	})

	it.each<[string, Board]>([
		['two tiles are swapped', boardOf(3, 3, [1, 0, 2, 3, 4, 5, 6, 7, GAP])],
		['the gap sits away from the last cell', gapCentre],
	])('is false when %s', (_case, board) => {
		const solved = isSolved(board)
		expect(solved).toBe(false)
	})
})

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
