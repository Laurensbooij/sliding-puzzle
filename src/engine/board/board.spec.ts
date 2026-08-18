import { describe, expect, it } from 'vitest'

import type { Board, CellIndex, Direction, Move, TileId } from '../types'
import { GAP } from '../types'
import {
	applyMove,
	cellForDirection,
	createBoard,
	directionOfMove,
	isSolved,
	movableTiles,
	movesForCell,
	toPlacements,
} from './board'

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

describe('toPlacements', () => {
	it('places every tile on its home cell when the board is solved', () => {
		const placements = toPlacements(createBoard(3, 3))
		expect(placements.every(({ cell, homeCell }) => cell === homeCell)).toBe(true)
	})

	it('produces one placement per tile, leaving the gap unrepresented', () => {
		const placements = toPlacements(gapCentre)
		expect(placements).toHaveLength(gapCentre.cells.length - 1)
	})

	it('reports the cell a tile currently occupies, not its home cell', () => {
		const placements = toPlacements(gapTopRight)
		const tileFive = placements.find(({ tile }) => tile === 5)
		expect(tileFive).toEqual({ tile: 5, cell: 1, homeCell: 5 })
	})

	it('keeps tile order stable across a move, so the DOM never reorders', () => {
		const before = toPlacements(gapCentre).map(({ tile }) => tile)
		const after = toPlacements(applyMove(gapCentre, { tile: 1, from: 1, to: 4 })).map(
			({ tile }) => tile,
		)
		expect(after).toEqual(before)
	})

	it('orders tiles by identity on a non-square board', () => {
		const placements = toPlacements(gapWideBoard)
		expect(placements.map(({ tile }) => tile)).toEqual([0, 1, 2, 3, 4, 5, 6])
	})
})

describe('cellForDirection', () => {
	// Model A (ADR-0014): the direction names where the tile travels, so the
	// named cell always sits on the opposite side of the gap.
	it.each<[Direction, CellIndex]>([
		['right', 3],
		['left', 5],
		['down', 1],
		['up', 7],
	])('names the tile that travels %s into a centred gap', (direction, expected) => {
		const cell = cellForDirection(gapCentre, direction)
		expect(cell).toBe(expected)
	})

	it.each<[string, Board, Direction]>([
		['the gap is against the top edge', gapTopRight, 'down'],
		['the gap is against the right edge', gapTopRight, 'left'],
		['the gap is against the right edge of a non-square board', gapWideBoard, 'left'],
	])('names no cell when %s', (_case, board, direction) => {
		const cell = cellForDirection(board, direction)
		expect(cell).toBeNull()
	})

	it('never wraps across a row boundary', () => {
		// Gap at cell 3 — row 1, column 0. Cell 2 is adjacent by index but sits
		// in the row above, so no tile can travel right into this gap.
		const gapRowStart = boardOf(3, 3, [0, 1, 2, GAP, 3, 4, 5, 6, 7])
		const cell = cellForDirection(gapRowStart, 'right')
		expect(cell).toBeNull()
	})

	it('names a cell that movesForCell agrees is playable', () => {
		const cell = cellForDirection(gapWideBoard, 'right')
		expect(cell).not.toBeNull()
		expect(movesForCell(gapWideBoard, cell ?? -1)).toHaveLength(1)
	})
})

describe('directionOfMove', () => {
	it.each<[Direction, Move]>([
		['right', { tile: 3, from: 3, to: 4 }],
		['left', { tile: 4, from: 5, to: 4 }],
		['down', { tile: 1, from: 1, to: 4 }],
		['up', { tile: 6, from: 7, to: 4 }],
	])('reads %s off the cells a tile moved between', (expected, move) => {
		const direction = directionOfMove(gapCentre, move)
		expect(direction).toBe(expected)
	})

	it('inverts cellForDirection for every direction', () => {
		const directions: Direction[] = ['up', 'down', 'left', 'right']
		directions.forEach((direction) => {
			const cell = cellForDirection(gapCentre, direction)
			const [move] = movesForCell(gapCentre, cell ?? -1)
			expect(move && directionOfMove(gapCentre, move)).toBe(direction)
		})
	})

	it('reads a column move on a non-square board, where the step is not the row length', () => {
		const direction = directionOfMove(gapWideBoard, { tile: 3, from: 7, to: 3 })
		expect(direction).toBe('up')
	})
})
