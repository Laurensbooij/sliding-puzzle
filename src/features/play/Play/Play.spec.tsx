import { DEFAULT_GAME_CONFIG, GAME_CONFIG_STORAGE_KEY, GameConfigProvider } from '@/lib/game-config'
import type { BoardSize } from '@/lib/game-config'
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, SettingsProvider } from '@/lib/settings'
import { createTranslate } from '@i18n'
import { gameMachine } from '@machines/game-machine'
import { renderWithProviders, seedStorage } from '@testing'
import type { RenderResult } from '@testing-library/react'
import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UserEvent } from '@testing-library/user-event'
import { BOARD_TESTIDS } from '@widgets/Board'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActorRefFrom } from 'xstate'
import { createActor } from 'xstate'

import { Play } from './Play'
import { PLAY_TESTIDS } from './constants'
import { playMessages } from './translation-messages'

const { translate } = createTranslate()

type GameActor = ActorRefFrom<typeof gameMachine>

interface PlayCase {
	boardSize?: BoardSize
	showTimer?: boolean
	game?: GameActor
	onAbandon?: () => void
}

const MOVES_LABEL = translate(playMessages.movesLabel)
const TIME_LABEL = translate(playMessages.timeLabel)
const BEST_LABEL = translate(playMessages.bestLabel)
const BOARD_SIZE_LABEL = translate(playMessages.boardSizeLabel)

const ABANDON_TITLE = translate(playMessages.abandonTitle)
const RESTART_TITLE = translate(playMessages.restartTitle)
const KEEP_PLAYING = translate(playMessages.keepPlaying)

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
 * A game one move from being solved: a 1×2 board can only be shuffled by
 * sliding its single tile aside, so pressing that tile finishes the game. Every
 * size Setup actually offers is walked twenty moves per cell, and no spec can
 * play a walk that long back out.
 *
 * The screen's own board size comes from the config, not from this actor, so
 * the Grid read-out still says whatever the case seeded — irrelevant here,
 * where what is under test is what the footer's controls do once a game is
 * over.
 */
const startNearlySolvedGame = (): GameActor => {
	const game = createActor(gameMachine, { input: { rows: 1, cols: 2, now: () => 0 } })
	game.start()
	game.send({ type: 'game.start' })
	return game
}

const renderComponent = ({
	boardSize = 3,
	showTimer = true,
	game = startGame(boardSize),
	onAbandon = vi.fn(),
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
				<Play game={game} onAbandon={onAbandon} />
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

/**
 * A footer control, by testid: its name is the Board's own message, which the
 * widget's barrel deliberately does not publish.
 */
const boardControl = (suffix: string): HTMLElement =>
	screen.getByTestId(`${BOARD_TESTIDS.BASE}${suffix}`)

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
 *   movement that produced them. **N/A for the two confirmations** as well:
 *   a card's arrival is announced by its role, name and description, which the
 *   cases below assert, and neither holds a value that changes while it is
 *   open. Cancelling changes nothing to speak of, and confirming replaces the
 *   screen or the board — the Board's own region owns whatever is left to say.
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

	/**
	 * The two confirmations. Both are plain `Dialog` compositions — no shared
	 * confirm wrapper — so what these cases own is the wiring: which control
	 * asks, what each answer does, and that neither asks once the game is over.
	 *
	 * Focus lands on the card rather than on an action, which is Dialog's
	 * behaviour and deliberately not overridden here: the destructive action
	 * cannot be fired by a stray Enter, and `Keep playing` is what the first Tab
	 * off the card reaches. The focus trap, the restore and the real Escape are
	 * `showModal()`'s, and jsdom implements none of them — the shim in
	 * `vitest.setup.ts` restores open/closed state and the Escape route only, so
	 * the stories in Chromium are what prove the rest.
	 */
	describe('abandoning', () => {
		it('asks before a game in progress is thrown away', async () => {
			const user = userEvent.setup()
			const onAbandon = vi.fn()
			renderComponent({ onAbandon })
			const abandon = boardControl(BOARD_TESTIDS.ABANDON_SUFFIX)

			await user.click(abandon)

			const confirmation = screen.getByRole('dialog', { name: ABANDON_TITLE })
			expect(confirmation).toBeVisible()
			expect(onAbandon).not.toHaveBeenCalled()
		})

		it('says what abandoning costs', async () => {
			const user = userEvent.setup()
			renderComponent()
			const abandon = boardControl(BOARD_TESTIDS.ABANDON_SUFFIX)

			await user.click(abandon)

			const confirmation = screen.getByRole('dialog', { name: ABANDON_TITLE })
			expect(confirmation).toHaveAccessibleDescription(
				translate(playMessages.abandonDescription),
			)
		})

		it('offers Keep playing before the destructive action', async () => {
			const user = userEvent.setup()
			renderComponent()
			await user.click(boardControl(BOARD_TESTIDS.ABANDON_SUFFIX))
			const confirmation = screen.getByRole('dialog', { name: ABANDON_TITLE })
			const keepPlaying = within(confirmation).getByRole('button', { name: KEEP_PLAYING })
			// Scoped to the card: the footer control that opened it carries the
			// same name, which is the point — one act, named once.
			const confirm = within(confirmation).getByRole('button', {
				name: translate(playMessages.abandonConfirm),
			})

			await user.tab()
			expect(keepPlaying).toHaveFocus()

			await user.tab()
			expect(confirm).toHaveFocus()
		})

		it('leaves the game exactly as it was when the player keeps playing', async () => {
			const user = userEvent.setup()
			const onAbandon = vi.fn()
			renderComponent({ onAbandon })
			await user.click(firstMovableTile())
			const moves = statValue(MOVES_LABEL)
			const movesPlayed = moves.textContent
			await user.click(boardControl(BOARD_TESTIDS.ABANDON_SUFFIX))
			const confirmation = screen.getByRole('dialog', { name: ABANDON_TITLE })
			const keepPlaying = screen.getByRole('button', { name: KEEP_PLAYING })

			await user.click(keepPlaying)

			expect(confirmation).not.toBeVisible()
			expect(moves.textContent).toBe(movesPlayed)
			expect(onAbandon).not.toHaveBeenCalled()
		})

		// Escape is the other way out of the card, and it must never be the
		// destructive path — Dialog asks to close, and closing here is cancelling.
		it('keeps playing on Escape', async () => {
			const user = userEvent.setup()
			const onAbandon = vi.fn()
			renderComponent({ onAbandon })
			await user.click(boardControl(BOARD_TESTIDS.ABANDON_SUFFIX))
			const confirmation = screen.getByRole('dialog', { name: ABANDON_TITLE })

			await user.keyboard('{Escape}')

			expect(confirmation).not.toBeVisible()
			expect(onAbandon).not.toHaveBeenCalled()
		})

		// Where the game goes next is the route's business (ADR-0017): the screen
		// only reports that it is over.
		it('reports the abandonment once it is confirmed', async () => {
			const user = userEvent.setup()
			const onAbandon = vi.fn()
			renderComponent({ onAbandon })
			await user.click(boardControl(BOARD_TESTIDS.ABANDON_SUFFIX))
			const confirmation = screen.getByRole('dialog', { name: ABANDON_TITLE })
			const confirm = within(confirmation).getByRole('button', {
				name: translate(playMessages.abandonConfirm),
			})

			await user.click(confirm)

			expect(onAbandon).toHaveBeenCalledOnce()
		})
	})

	describe('restarting', () => {
		it('asks before a game in progress is reshuffled', async () => {
			const user = userEvent.setup()
			renderComponent()
			await user.click(firstMovableTile())
			const moves = statValue(MOVES_LABEL)
			const movesPlayed = moves.textContent

			await user.click(boardControl(BOARD_TESTIDS.RESTART_SUFFIX))

			const confirmation = screen.getByRole('dialog', { name: RESTART_TITLE })
			expect(confirmation).toBeVisible()
			expect(moves.textContent).toBe(movesPlayed)
		})

		it('says what restarting costs', async () => {
			const user = userEvent.setup()
			renderComponent()

			await user.click(boardControl(BOARD_TESTIDS.RESTART_SUFFIX))

			const confirmation = screen.getByRole('dialog', { name: RESTART_TITLE })
			expect(confirmation).toHaveAccessibleDescription(
				translate(playMessages.restartDescription),
			)
		})

		it('leaves the game exactly as it was when the player keeps playing', async () => {
			const user = userEvent.setup()
			renderComponent()
			await user.click(firstMovableTile())
			const moves = statValue(MOVES_LABEL)
			const movesPlayed = moves.textContent
			await user.click(boardControl(BOARD_TESTIDS.RESTART_SUFFIX))
			const confirmation = screen.getByRole('dialog', { name: RESTART_TITLE })
			const keepPlaying = screen.getByRole('button', { name: KEEP_PLAYING })

			await user.click(keepPlaying)

			expect(confirmation).not.toBeVisible()
			expect(moves.textContent).toBe(movesPlayed)
		})

		it('deals a fresh game once it is confirmed', async () => {
			const user = userEvent.setup()
			renderComponent()
			await user.click(firstMovableTile())
			const announcer = screen.getByRole('status')
			const announcedByTheMove = announcer.textContent
			await user.click(boardControl(BOARD_TESTIDS.RESTART_SUFFIX))
			const confirmation = screen.getByRole('dialog', { name: RESTART_TITLE })
			const confirm = within(confirmation).getByRole('button', {
				name: translate(playMessages.restartConfirm),
			})

			await user.click(confirm)

			const moves = statValue(MOVES_LABEL)
			expect(confirmation).not.toBeVisible()
			expect(moves).toHaveTextContent('00')
			// A fresh deal is not a move, however many tiles it put somewhere else
			// — so the region gains nothing to say and stays on its last sentence.
			expect(announcer.textContent).toBe(announcedByTheMove)
		})
	})

	/**
	 * A solved game holds nothing worth protecting: its result is already
	 * recorded, so both controls act at once (SLI-42). The dialog the solved
	 * board raises of its own accord is another ticket's.
	 */
	describe('once the game is solved', () => {
		const renderSolvedGame = async (user: UserEvent, onAbandon = vi.fn()): Promise<void> => {
			renderComponent({ game: startNearlySolvedGame(), onAbandon })
			await user.click(firstMovableTile())
		}

		it('abandons without asking', async () => {
			const user = userEvent.setup()
			const onAbandon = vi.fn()
			await renderSolvedGame(user, onAbandon)

			await user.click(boardControl(BOARD_TESTIDS.ABANDON_SUFFIX))

			const confirmation = screen.queryByRole('dialog')
			expect(confirmation).not.toBeInTheDocument()
			expect(onAbandon).toHaveBeenCalledOnce()
		})

		it('restarts without asking', async () => {
			const user = userEvent.setup()
			await renderSolvedGame(user)
			const moves = statValue(MOVES_LABEL)
			const solvedMoves = moves.textContent

			await user.click(boardControl(BOARD_TESTIDS.RESTART_SUFFIX))

			const confirmation = screen.queryByRole('dialog')
			expect(confirmation).not.toBeInTheDocument()
			expect(moves.textContent).not.toBe(solvedMoves)
		})
	})
})
