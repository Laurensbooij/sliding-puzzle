import type { Board, CellIndex } from '@engine'
import { applyMove, createBoard, isSolved, movesForCell, shuffle } from '@engine'
import { assign, setup } from 'xstate'

/** What a game needs to exist: its dimensions, plus the two impure sources it may not reach for itself. */
export interface GameInput {
	rows: number
	cols: number
	/** Seedable in tests — the engine takes randomness as an argument (ADR-0001). */
	random?: () => number
	/** Seedable in tests, so elapsed time never depends on the wall clock. */
	now?: () => number
}

/**
 * A game: a board together with its move count and status (CONTEXT.md). Elapsed
 * time is kept as two instants rather than a ticking counter — `elapsedMs`
 * derives the duration, so the machine never schedules a timer.
 */
export interface GameContext {
	board: Board
	moveCount: number
	startedAt: number | null
	finishedAt: number | null
	random: () => number
	now: () => number
}

export type GameEvent =
	| { type: 'game.start' }
	/** Presses a cell; ignored unless it yields at least one move. */
	| { type: 'cell.press'; cell: CellIndex }
	/** Deals a new game, from anywhere in the lifecycle. */
	| { type: 'game.restart' }

/**
 * Milliseconds spent playing: zero before the game starts, live while playing,
 * frozen once solved.
 */
export const elapsedMs = ({ startedAt, finishedAt, now }: GameContext): number =>
	startedAt === null ? 0 : (finishedAt ?? now()) - startedAt

/**
 * The game lifecycle (ADR-0003): idle → playing → solved. The engine stays the
 * sole authority on legality — every guard and action here delegates to it.
 */
export const gameMachine = setup({
	types: {
		context: {} as GameContext,
		events: {} as GameEvent,
		input: {} as GameInput,
	},
	actions: {
		shuffleBoard: assign({
			board: ({ context }) =>
				shuffle(createBoard(context.board.rows, context.board.cols), context.random),
		}),
		startClock: assign({
			moveCount: 0,
			startedAt: ({ context }) => context.now(),
			finishedAt: null,
		}),
		stopClock: assign({
			finishedAt: ({ context }) => context.now(),
		}),
	},
	guards: {
		boardIsSolved: ({ context }) => isSolved(context.board),
	},
}).createMachine({
	id: 'game',
	context: ({ input }) => ({
		board: createBoard(input.rows, input.cols),
		moveCount: 0,
		startedAt: null,
		finishedAt: null,
		random: input.random ?? Math.random,
		now: input.now ?? Date.now,
	}),
	initial: 'idle',
	// Restarting is a lifecycle-wide escape hatch, so it lives above the states
	// rather than being repeated in each of them. `reenter` makes it re-run
	// `startClock` even when the game was already playing.
	on: {
		'game.restart': { target: '.playing', actions: 'shuffleBoard', reenter: true },
	},
	states: {
		idle: {
			on: {
				'game.start': { target: 'playing', actions: 'shuffleBoard' },
			},
		},
		playing: {
			entry: 'startClock',
			// Win detection rides the last move: the board is re-checked after every
			// action in this state, so no transition has to remember to look.
			always: { guard: 'boardIsSolved', target: 'solved' },
			on: {
				// Inlined rather than named in `setup(…)` above: only a transition's
				// own implementations see the event narrowed to cell.press.
				'cell.press': {
					guard: ({ context, event }) =>
						movesForCell(context.board, event.cell).length > 0,
					actions: assign(({ context, event }) => {
						const moves = movesForCell(context.board, event.cell)
						return {
							board: moves.reduce(applyMove, context.board),
							moveCount: context.moveCount + moves.length,
						}
					}),
				},
			},
		},
		solved: {
			entry: 'stopClock',
		},
	},
})
