import { describe, expect, it } from 'vitest'

import { applyMove, movableTiles, movesForCell } from './board'
import type { Board, CellIndex, TileId } from './types'
import { GAP } from './types'

const boardOf = (rows: number, cols: number, cells: readonly (TileId | typeof GAP)[]): Board => ({
	rows,
	cols,
	cells,
})

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
