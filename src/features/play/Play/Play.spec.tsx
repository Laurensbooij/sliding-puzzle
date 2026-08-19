import { DEFAULT_GAME_CONFIG, GAME_CONFIG_STORAGE_KEY, GameConfigProvider } from '@/lib/game-config'
import type { BoardSize } from '@/lib/game-config'
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, SettingsProvider } from '@/lib/settings'
import { createBoard, shuffle } from '@engine'
import { createTranslate } from '@i18n'
import { gameMachine } from '@machines/game-machine'
import { renderWithProviders, seedStorage } from '@testing'
import type { RenderResult } from '@testing-library/react'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BOARD_TESTIDS } from '@widgets/Board'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActorRefFrom } from 'xstate'
import { assign, createActor } from 'xstate'

import { Play } from './Play'
import { solvedMessages } from './components/Solved/translation-messages'
import { PLAY_TESTIDS } from './constants'
import { playMessages } from './translation-messages'

const { translate } = createTranslate()

type GameActor = ActorRefFrom<typeof gameMachine>

interface PlayCase {
	boardSize?: BoardSize
	showTimer?: boolean
	game?: GameActor
}

const MOVES_LABEL = translate(playMessages.movesLabel)
const TIME_LABEL = translate(playMessages.timeLabel)
const BEST_LABEL = translate(playMessages.bestLabel)
const BOARD_SIZE_LABEL = translate(playMessages.boardSizeLabel)

const SECOND_MS = 1000

/**
 * A started game, exactly as the Play route hands one over: created, started
 * and dealt. The clock is a getter so a case can move time without waiting for
 * it — which is the reason the machine takes `now` as input at all (ADR-0001).
 */
const startGame = (boardSize: BoardSize = 3, now: () => number = () => 0): GameActor => {
	const game = createActor(gameMachine, { input: { rows: boardSize, cols: boardSize, now } })
	game.start()
	game.send({ type: 'game.start' })
	return game
}

/**
 * The two instants a finished game is timed by, handed out in order: the
 * machine reads the clock once when the game starts and once when it finishes,
 * and a game that is already over by the first render leaves no other moment to
 * move time in.
 */
const stopwatchReading = (elapsed: number): (() => number) => {
	const readings = [0, elapsed]
	return () => readings.shift() ?? elapsed
}

interface SolvedGameCase {
	boardSize?: BoardSize
	/** Milliseconds the finished game took, as the two clock readings above. */
	elapsed?: number
	/** How many of this game's deals come out solved; later ones shuffle for real. */
	dealsSolved?: number
}

/**
 * A game that comes out solved: the route's own actor with the shuffle taken
 * out of its first deal. The engine never returns a solved board from one —
 * deliberately, see ADR-0002 — so skipping it is the only way to hold a won
 * game, and it is exactly the step a win is the absence of.
 *
 * Every later deal shuffles as the app's does, so `Play again` from the card
 * lands on a real board rather than on another instant win.
 */
const solvedGame = ({
	boardSize = 3,
	elapsed = 0,
	dealsSolved = 1,
}: SolvedGameCase = {}): GameActor => {
	let deals = 0
	const machine = gameMachine.provide({
		actions: {
			shuffleBoard: assign({
				board: ({ context }) => {
					deals += 1
					const dealt = createBoard(context.board.rows, context.board.cols)
					return deals <= dealsSolved ? dealt : shuffle(dealt, context.random)
				},
			}),
		},
	})

	const game = createActor(machine, {
		input: { rows: boardSize, cols: boardSize, now: stopwatchReading(elapsed) },
	})
	game.start()
	game.send({ type: 'game.start' })
	return game
}

const renderComponent = ({
	boardSize = 3,
	showTimer = true,
	game = startGame(boardSize),
}: PlayCase = {}): RenderResult => {
	// Both providers hydrate from storage on mount, so a case states its config
	// and settings the way a returning player's browser would.
	seedStorage({
		[GAME_CONFIG_STORAGE_KEY]: JSON.stringify({ ...DEFAULT_GAME_CONFIG, boardSize }),
		[SETTINGS_STORAGE_KEY]: JSON.stringify({ ...DEFAULT_SETTINGS, showTimer }),
	})

	return renderWithProviders(
		<GameConfigProvider>
			<SettingsProvider>
				<Play game={game} />
			</SettingsProvider>
		</GameConfigProvider>,
	)
}

/**
 * The tiles a press would actually move — the only buttons the board leaves
 * enabled, and the footer's two controls carry no such state. Their accessible
 * names belong to the Tile and to its own spec; what matters here is the
 * movable/immovable split.
 */
const movableTileButtons = (): HTMLElement[] =>
	screen
		.getAllByRole('button')
		.filter((button) => button.getAttribute('aria-disabled') === 'false')

/** Every shuffled board leaves at least two tiles beside the gap. */
const firstMovableTile = (): HTMLElement => {
	const [tile] = movableTileButtons()
	if (!tile) throw new Error('The board rendered no movable tile')
	return tile
}

const statValue = (label: string): HTMLElement => screen.getByRole('definition', { name: label })

const readOutTestIds = [
	PLAY_TESTIDS.STATS_SUFFIX,
	PLAY_TESTIDS.MOVES_SUFFIX,
	PLAY_TESTIDS.TIME_SUFFIX,
	PLAY_TESTIDS.BEST_SUFFIX,
	PLAY_TESTIDS.BOARD_SIZE_SUFFIX,
].map((suffix) => `${PLAY_TESTIDS.BASE}${suffix}`)

/**
 * WCAG 2.2 AA determinations for Play, per docs/conventions/accessibility.md.
 *
 * - Keyboard — the operation map is the Board's, asserted in full in its spec.
 *   What this screen owes is that nothing it adds steals a key or a tab stop,
 *   which the cases below check from the outside.
 * - Focus (SC 2.4.11) — everything focusable here is the Board's, and draws its
 *   own ring. The heading is clipped and takes focus only programmatically,
 *   after a route change.
 * - Target size (SC 2.5.8) — N/A: the read-outs are not targets, and the
 *   board's controls carry their own sizing.
 * - Announcements — **N/A for the Time card, deliberately**, and asserted
 *   below. A value that changes once a second makes a live region unusable
 *   noise; it stays in the accessibility tree and reads as "Time, 01:18" on
 *   demand. Moves are already spoken by the Board's live region, as the tile
 *   movement that produced them.
 * - Reduced motion — N/A: this screen declares no transition or animation.
 */
describe('Play', () => {
	it('names itself with a heading, so a route change lands somewhere', () => {
		renderComponent()

		const heading = screen.getByRole('heading', {
			level: 1,
			name: translate(playMessages.heading),
		})
		expect(heading).toBeInTheDocument()
	})

	it('shows the board being played', () => {
		renderComponent()

		const board = screen.getByRole('group')
		expect(board).toBeInTheDocument()
	})

	describe('read-outs', () => {
		it('starts the move count at a padded zero', () => {
			renderComponent()

			const moves = statValue(MOVES_LABEL)
			expect(moves).toHaveTextContent('00')
		})

		it('counts every tile a press relocates', async () => {
			const user = userEvent.setup()
			renderComponent()
			const tile = firstMovableTile()

			await user.click(tile)

			const moves = statValue(MOVES_LABEL)
			expect(moves).not.toHaveTextContent('00')
		})

		it('reads the board size off the game config', () => {
			renderComponent({ boardSize: 4 })

			const boardSize = statValue(BOARD_SIZE_LABEL)
			expect(boardSize).toHaveTextContent(
				translate(playMessages.boardSizeValue, { rows: 4, cols: 4 }),
			)
		})

		// Records exist, but nothing writes one yet — so the card stands empty
		// rather than inventing a number to fill itself with.
		it('leaves the best empty until there is a record to show', () => {
			renderComponent()

			const best = statValue(BEST_LABEL)
			expect(best).toHaveTextContent(translate(playMessages.bestUnset))
		})

		it('gives every read-out its own testid, so the collection stays addressable', () => {
			renderComponent()

			const found = readOutTestIds.map((testId) => screen.queryByTestId(testId))
			expect(found.every(Boolean)).toBe(true)
		})
	})

	describe('the clock', () => {
		let currentTime = 0

		const renderRunningGame = (showTimer = true): RenderResult =>
			renderComponent({ showTimer, game: startGame(3, () => currentTime) })

		beforeEach(() => {
			currentTime = 0
			vi.useFakeTimers()
		})

		afterEach(() => {
			vi.useRealTimers()
			vi.restoreAllMocks()
		})

		it('starts at zero', () => {
			renderRunningGame()

			const time = statValue(TIME_LABEL)
			expect(time).toHaveTextContent('00:00')
		})

		it('re-reads the machine once a second while the game runs', () => {
			renderRunningGame()

			currentTime = 78 * SECOND_MS
			act(() => {
				vi.advanceTimersByTime(SECOND_MS)
			})

			const time = statValue(TIME_LABEL)
			expect(time).toHaveTextContent('01:18')
		})

		/**
		 * The deliberate N/A. The value sits in the accessibility tree and reads
		 * as "Time, 01:18" whenever it is asked for; nothing carries it into a
		 * live region, and the board's own region — the only one on the screen —
		 * has nothing to say about a second passing.
		 */
		it('never announces the second it just moved to', () => {
			renderRunningGame()

			currentTime = 78 * SECOND_MS
			act(() => {
				vi.advanceTimersByTime(SECOND_MS)
			})

			const timeCard = screen.getByTestId(`${PLAY_TESTIDS.BASE}${PLAY_TESTIDS.TIME_SUFFIX}`)
			const stats = screen.getByTestId(`${PLAY_TESTIDS.BASE}${PLAY_TESTIDS.STATS_SUFFIX}`)
			const announcer = screen.getByRole('status')
			expect(timeCard).not.toHaveAttribute('aria-live')
			expect(stats).not.toHaveAttribute('aria-live')
			expect(announcer.textContent).toBe('')
		})

		/**
		 * Spying on the scheduler rather than counting pending timers: fake
		 * timers capture React's own scheduling too, so a count is a fact about
		 * the whole render rather than about the clock.
		 */
		it('schedules no clock at all while the timer is hidden', () => {
			const scheduleInterval = vi.spyOn(window, 'setInterval')

			renderRunningGame(false)

			expect(scheduleInterval).not.toHaveBeenCalled()
		})
	})

	describe('with the timer hidden', () => {
		it('drops the time card', () => {
			renderComponent({ showTimer: false })

			const time = screen.queryByRole('definition', { name: TIME_LABEL })
			expect(time).not.toBeInTheDocument()
		})

		it('keeps the other three read-outs', () => {
			renderComponent({ showTimer: false })

			const readOuts = screen.getAllByRole('definition')
			expect(readOuts).toHaveLength(3)
		})
	})

	describe('keyboard', () => {
		it('reaches a movable tile with Tab and plays it with Enter', async () => {
			const user = userEvent.setup()
			renderComponent()

			await user.tab()
			const tile = firstMovableTile()
			expect(tile).toHaveFocus()

			await user.keyboard('{Enter}')
			const moves = statValue(MOVES_LABEL)
			expect(moves).not.toHaveTextContent('00')
		})

		it('plays the tile an arrow names, from anywhere inside the board', async () => {
			const user = userEvent.setup()
			renderComponent()

			await user.tab()
			await user.keyboard('{ArrowUp}{ArrowDown}{ArrowLeft}{ArrowRight}')

			const moves = statValue(MOVES_LABEL)
			expect(moves).not.toHaveTextContent('00')
		})

		it('adds no tab stop of its own before the board', async () => {
			const user = userEvent.setup()
			renderComponent()

			await user.tab()
			const tile = firstMovableTile()
			expect(tile).toHaveFocus()
		})
	})

	// The confirmation the design puts in front of this belongs to another
	// ticket; what this screen owes is that the control reaches the machine at
	// all. Queried by testid because the control's name is the Board's own
	// message, which its barrel deliberately does not publish.
	it('deals a new game when the board asks to restart', async () => {
		const user = userEvent.setup()
		renderComponent()
		await user.click(firstMovableTile())
		const restart = screen.getByTestId(`${BOARD_TESTIDS.BASE}${BOARD_TESTIDS.RESTART_SUFFIX}`)
		const announcer = screen.getByRole('status')
		const announcedByTheMove = announcer.textContent

		await user.click(restart)

		const moves = statValue(MOVES_LABEL)
		expect(moves).toHaveTextContent('00')
		// A fresh deal is not a move, however many tiles it put somewhere else —
		// so the region gains nothing to say and stays on its last sentence.
		expect(announcer.textContent).toBe(announcedByTheMove)
	})

	/**
	 * The win. No case here plays a move — the game is over before the first
	 * render — so the card counts the nought moves an untouched solved board
	 * took, and what matters is that it counts the machine's number at all.
	 */
	describe('once the board is solved', () => {
		const WON_IN_NO_MOVES = translate(solvedMessages.title, { count: 0 })
		const SOLVED_HINT = translate(playMessages.solvedHint)

		const playAgainButton = (): HTMLElement =>
			screen.getByRole('button', { name: translate(solvedMessages.playAgain) })

		it('raises the win card, named by the moves the game took', () => {
			renderComponent({ game: solvedGame() })

			const card = screen.getByRole('dialog', { name: WON_IN_NO_MOVES })
			expect(card).toBeVisible()
		})

		it('describes the win with the elapsed time, frozen where the clock stopped', () => {
			renderComponent({ game: solvedGame({ elapsed: 78 * SECOND_MS }) })

			const card = screen.getByRole('dialog', { name: WON_IN_NO_MOVES })
			expect(card).toHaveAccessibleDescription(
				translate(solvedMessages.description, { time: '01:18' }),
			)
		})

		it('changes the board footer line to Solved', () => {
			renderComponent({ game: solvedGame() })

			const hint = screen.getByText(SOLVED_HINT)
			expect(hint).toBeVisible()
		})

		/**
		 * The deliberate N/A from the ticket, asserted where both surfaces exist:
		 * the card's own arrival is the announcement, and the board's region
		 * reports moves. Saying the win twice is worse than saying it once.
		 */
		it('never pushes the win through the board’s live region', () => {
			renderComponent({ game: solvedGame() })

			const announcer = screen.getByRole('status')
			expect(announcer.textContent).toBe('')
		})

		it('closes to the solved board on Escape, footer line intact', async () => {
			const user = userEvent.setup()
			renderComponent({ game: solvedGame() })

			await user.keyboard('{Escape}')

			const card = screen.queryByRole('dialog')
			const board = screen.getByRole('group')
			const hint = screen.getByText(SOLVED_HINT)
			expect(card).not.toBeInTheDocument()
			expect(board).toBeVisible()
			expect(hint).toBeVisible()
		})

		it('deals a new game at the same size from Play again', async () => {
			const user = userEvent.setup()
			renderComponent({ boardSize: 4, game: solvedGame({ boardSize: 4 }) })

			await user.click(playAgainButton())

			const card = screen.queryByRole('dialog')
			const boardSize = statValue(BOARD_SIZE_LABEL)
			const solvedHint = screen.queryByText(SOLVED_HINT)
			expect(card).not.toBeInTheDocument()
			expect(boardSize).toHaveTextContent(
				translate(playMessages.boardSizeValue, { rows: 4, cols: 4 }),
			)
			expect(solvedHint).not.toBeInTheDocument()
		})

		/**
		 * The card writes the size to the config provider and stays put; the
		 * actor keyed on that size is the route's, and `PlayRoute.spec` is where
		 * the new deal it forces is asserted.
		 */
		it('starts the next size up in place, without leaving Play', async () => {
			const user = userEvent.setup()
			renderComponent({ game: solvedGame() })
			const trySize = screen.getByRole('button', {
				name: translate(solvedMessages.tryNextSize, { size: 4 }),
			})

			await user.click(trySize)

			const boardSize = statValue(BOARD_SIZE_LABEL)
			const play = screen.getByTestId(PLAY_TESTIDS.BASE)
			expect(boardSize).toHaveTextContent(
				translate(playMessages.boardSizeValue, { rows: 4, cols: 4 }),
			)
			expect(play).toBeVisible()
		})

		/**
		 * A dismissal belongs to the solve it closed. The same actor plays every
		 * game on this screen, so a card that stayed dismissed would swallow every
		 * win after the first one an Escape closed.
		 */
		it('raises the card again for the next win, after an Escape closed the last', async () => {
			const user = userEvent.setup()
			renderComponent({ game: solvedGame({ dealsSolved: 2 }) })
			await user.keyboard('{Escape}')
			const restart = screen.getByTestId(
				`${BOARD_TESTIDS.BASE}${BOARD_TESTIDS.RESTART_SUFFIX}`,
			)

			await user.click(restart)

			const card = screen.getByRole('dialog', { name: WON_IN_NO_MOVES })
			expect(card).toBeVisible()
		})
	})
})
