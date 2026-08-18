import type { Board, CellIndex } from '@engine'
import { GAP, isSolved, movesForCell } from '@engine'
import { describe, expect, it } from 'vitest'
import { createActor } from 'xstate'

import type { GameInput } from './game-machine'
import { elapsedMs, gameMachine } from './game-machine'

/** Seeded PRNG (mulberry32): the shuffle stays random in shape but repeatable across runs. */
const randomFrom = (seed: number): (() => number) => {
	let state = seed + 0x6d2b79f5
	return () => {
		state = (state + 0x6d2b79f5) | 0
		let drawn = Math.imul(state ^ (state >>> 15), 1 | state)
		drawn = (drawn + Math.imul(drawn ^ (drawn >>> 7), 61 | drawn)) ^ drawn
		return ((drawn ^ (drawn >>> 14)) >>> 0) / 4294967296
	}
}

/** A clock the test moves by hand, so elapsed time never depends on the wall clock. */
const stoppedClock = () => {
	let time = 0
	return { now: () => time, advance: (ms: number) => (time += ms) }
}

const gameOf = (input: Partial<GameInput> = {}) =>
	createActor(gameMachine, {
		input: { rows: 3, cols: 3, random: randomFrom(1), now: stoppedClock().now, ...input },
	}).start()

/**
 * A 1x3 board is the smallest board with a real move, and every arrangement of
 * it that is not solved is exactly one press of the last cell away from solved.
 * That drives the lifecycle to `solved` without a solver in the test.
 */
const solvableInOnePress = { rows: 1, cols: 3 } as const
const LAST_CELL_OF_1X3: CellIndex = 2

const cellWithRun = (board: Board): CellIndex =>
	board.cells.findIndex((_, cell) => movesForCell(board, cell).length > 1)

describe('gameMachine', () => {
	it('waits idle on a solved board with nothing counted yet', () => {
		const game = gameOf()
		const { value, context } = game.getSnapshot()
		expect(value).toBe('idle')
		expect(isSolved(context.board)).toBe(true)
		expect(context.moveCount).toBe(0)
	})

	it('shuffles the board and begins playing on START', () => {
		const game = gameOf()
		game.send({ type: 'START' })
		const { value, context } = game.getSnapshot()
		expect(value).toBe('playing')
		expect(isSolved(context.board)).toBe(false)
		expect(context.moveCount).toBe(0)
	})

	it('ignores a press before the game has started', () => {
		const game = gameOf()
		const boardWhenIdle = game.getSnapshot().context.board
		game.send({ type: 'PRESS_CELL', cell: 0 })
		const { value, context } = game.getSnapshot()
		expect(value).toBe('idle')
		expect(context.board).toEqual(boardWhenIdle)
	})

	describe('pressing a cell', () => {
		it('counts one move per tile of the run and leaves the gap on the pressed cell', () => {
			const game = gameOf({ rows: 4, cols: 4 })
			game.send({ type: 'START' })
			const boardBeforePress = game.getSnapshot().context.board
			const pressedCell = cellWithRun(boardBeforePress)
			const runLength = movesForCell(boardBeforePress, pressedCell).length

			game.send({ type: 'PRESS_CELL', cell: pressedCell })

			const { context } = game.getSnapshot()
			// A run of N tiles shifts every one of them by a cell and lands the gap
			// on the pressed cell, so exactly N+1 cells change hands.
			const cellsChanged = context.board.cells.filter(
				(tile, cell) => tile !== boardBeforePress.cells[cell],
			).length
			expect(runLength).toBeGreaterThan(1)
			expect(context.moveCount).toBe(runLength)
			expect(context.board.cells[pressedCell]).toBe(GAP)
			expect(cellsChanged).toBe(runLength + 1)
		})

		it('accumulates the move count across presses', () => {
			const game = gameOf({ rows: 4, cols: 4 })
			game.send({ type: 'START' })
			const firstPress = cellWithRun(game.getSnapshot().context.board)
			const firstMoves = movesForCell(game.getSnapshot().context.board, firstPress)
			game.send({ type: 'PRESS_CELL', cell: firstPress })
			const secondPress = cellWithRun(game.getSnapshot().context.board)
			const secondMoves = movesForCell(game.getSnapshot().context.board, secondPress)

			game.send({ type: 'PRESS_CELL', cell: secondPress })

			const { context } = game.getSnapshot()
			expect(context.moveCount).toBe(firstMoves.length + secondMoves.length)
		})

		it('leaves the game untouched when the cell yields no move', () => {
			const game = gameOf()
			game.send({ type: 'START' })
			const boardBeforePress = game.getSnapshot().context.board
			const gapCell = boardBeforePress.cells.indexOf(GAP)

			game.send({ type: 'PRESS_CELL', cell: gapCell })

			const { value, context } = game.getSnapshot()
			expect(value).toBe('playing')
			expect(context.board).toEqual(boardBeforePress)
			expect(context.moveCount).toBe(0)
		})
	})

	describe('win detection', () => {
		it('reaches solved on the move that puts the last tile in its home cell', () => {
			const game = gameOf(solvableInOnePress)
			game.send({ type: 'START' })

			game.send({ type: 'PRESS_CELL', cell: LAST_CELL_OF_1X3 })

			const { value, context } = game.getSnapshot()
			expect(value).toBe('solved')
			expect(isSolved(context.board)).toBe(true)
			expect(context.moveCount).toBeGreaterThan(0)
		})

		it('ignores further presses once the board is solved', () => {
			const game = gameOf(solvableInOnePress)
			game.send({ type: 'START' })
			game.send({ type: 'PRESS_CELL', cell: LAST_CELL_OF_1X3 })
			const solvedGame = game.getSnapshot().context

			game.send({ type: 'PRESS_CELL', cell: 0 })

			const { value, context } = game.getSnapshot()
			expect(value).toBe('solved')
			expect(context.board).toEqual(solvedGame.board)
			expect(context.moveCount).toBe(solvedGame.moveCount)
		})
	})

	describe('restarting', () => {
		it('deals a fresh shuffle and clears the move count from solved', () => {
			const game = gameOf(solvableInOnePress)
			game.send({ type: 'START' })
			game.send({ type: 'PRESS_CELL', cell: LAST_CELL_OF_1X3 })

			game.send({ type: 'RESTART' })

			const { value, context } = game.getSnapshot()
			expect(value).toBe('playing')
			expect(isSolved(context.board)).toBe(false)
			expect(context.moveCount).toBe(0)
			expect(context.finishedAt).toBeNull()
		})

		it('deals a fresh shuffle and clears the move count mid-game', () => {
			const game = gameOf()
			game.send({ type: 'START' })
			const pressedCell = cellWithRun(game.getSnapshot().context.board)
			game.send({ type: 'PRESS_CELL', cell: pressedCell })

			game.send({ type: 'RESTART' })

			const { value, context } = game.getSnapshot()
			expect(value).toBe('playing')
			expect(isSolved(context.board)).toBe(false)
			expect(context.moveCount).toBe(0)
		})

		it('deals the first game straight from idle', () => {
			const game = gameOf()

			game.send({ type: 'RESTART' })

			const { value, context } = game.getSnapshot()
			expect(value).toBe('playing')
			expect(isSolved(context.board)).toBe(false)
		})
	})

	describe('elapsed time', () => {
		it('is zero while the game waits in setup', () => {
			const game = gameOf()
			const elapsed = elapsedMs(game.getSnapshot().context)
			expect(elapsed).toBe(0)
		})

		it('runs with the clock while the game is playing', () => {
			const clock = stoppedClock()
			const game = gameOf({ now: clock.now })
			game.send({ type: 'START' })
			clock.advance(5000)

			const elapsed = elapsedMs(game.getSnapshot().context)
			expect(elapsed).toBe(5000)
		})

		it('freezes at the instant the board was solved', () => {
			const clock = stoppedClock()
			const game = gameOf({ ...solvableInOnePress, now: clock.now })
			game.send({ type: 'START' })
			clock.advance(5000)
			game.send({ type: 'PRESS_CELL', cell: LAST_CELL_OF_1X3 })
			clock.advance(3000)

			const elapsed = elapsedMs(game.getSnapshot().context)
			expect(elapsed).toBe(5000)
		})

		it('restarts from zero when the game is dealt again', () => {
			const clock = stoppedClock()
			const game = gameOf({ ...solvableInOnePress, now: clock.now })
			game.send({ type: 'START' })
			clock.advance(5000)
			game.send({ type: 'PRESS_CELL', cell: LAST_CELL_OF_1X3 })

			game.send({ type: 'RESTART' })

			const elapsed = elapsedMs(game.getSnapshot().context)
			expect(elapsed).toBe(0)
		})
	})
})
