import { DEFAULT_GAME_CONFIG, GAME_CONFIG_STORAGE_KEY, GameConfigProvider } from '@/lib/game-config'
import type { BoardSize } from '@/lib/game-config'
import { RECORDS_STORAGE_KEY, RecordsProvider } from '@/lib/records'
import type { Records } from '@/lib/records'
import {
	DEFAULT_SETTINGS,
	SETTINGS_STORAGE_KEY,
	SettingsProvider,
	useSettings,
} from '@/lib/settings'
import { createTranslate } from '@i18n'
import { gameMachine } from '@machines/game-machine'
import { globalMessages } from '@messages'
import { readStorage, renderWithProviders, seedStorage } from '@testing'
import type { RenderResult } from '@testing-library/react'
import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UserEvent } from '@testing-library/user-event'
import { BOARD_TESTIDS } from '@widgets/Board'
import type { FC } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActorRefFrom } from 'xstate'
import { createActor } from 'xstate'

import { Play } from './Play'
import { solvedMessages } from './components/Solved/translation-messages'
import { PLAY_TESTIDS } from './constants'
import { playMessages } from './translation-messages'

const { translate } = createTranslate()

type GameActor = ActorRefFrom<typeof gameMachine>

interface PlayCase {
	boardSize?: BoardSize
	showTimer?: boolean
	referenceImage?: boolean
	numberedTiles?: boolean
	/** Mounts the two switches beside the screen, for the cases that flip one mid-game. */
	withSettingsSwitches?: boolean
	/** The records the player arrives with, as their browser would hold them. */
	bests?: Records['bests']
	game?: GameActor
	onAbandon?: () => void
}

const MOVES_LABEL = translate(playMessages.movesLabel)
const TIME_LABEL = translate(playMessages.timeLabel)
const BEST_LABEL = translate(playMessages.bestLabel)
const BOARD_SIZE_LABEL = translate(playMessages.boardSizeLabel)

const ABANDON_TITLE = translate(playMessages.abandonTitle)
const RESTART_TITLE = translate(playMessages.restartTitle)
const KEEP_PLAYING = translate(globalMessages.keepPlaying)

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
 * The clock a finished game is timed by, handing out its two instants in order.
 * The machine reads one when the game starts and one when it finishes, so a
 * game won in a single press leaves no other moment to move time in.
 */
const clockStoppingAt = (elapsed: number): (() => number) => {
	const readings = [0, elapsed]
	return () => readings.shift() ?? elapsed
}

const NUMBERED_SWITCH = 'Numbered tiles'
const REFERENCE_IMAGE_SWITCH = 'Reference image'

/**
 * The Settings dialog's two presentational switches, reduced to what a case
 * needs: something outside Play that writes the provider it reads. The real
 * dialog lives in the shell, so a case cannot reach one from here.
 */
const SettingsSwitches: FC = () => {
	const { referenceImage, numberedTiles, setReferenceImage, setNumberedTiles } = useSettings()

	return (
		<>
			<button type="button" onClick={() => setNumberedTiles(!numberedTiles)}>
				{NUMBERED_SWITCH}
			</button>
			<button type="button" onClick={() => setReferenceImage(!referenceImage)}>
				{REFERENCE_IMAGE_SWITCH}
			</button>
		</>
	)
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
const startNearlySolvedGame = (now: () => number = () => 0): GameActor => {
	const game = createActor(gameMachine, { input: { rows: 1, cols: 2, now } })
	game.start()
	game.send({ type: 'game.start' })
	return game
}

const renderComponent = ({
	boardSize = 3,
	showTimer = true,
	referenceImage = DEFAULT_SETTINGS.referenceImage,
	numberedTiles = DEFAULT_SETTINGS.numberedTiles,
	withSettingsSwitches = false,
	bests = {},
	game = startGame(boardSize),
	onAbandon = vi.fn(),
}: PlayCase = {}): RenderResult => {
	// Every provider hydrates from storage on mount, so a case states its config,
	// settings and records the way a returning player's browser would.
	seedStorage({
		[GAME_CONFIG_STORAGE_KEY]: JSON.stringify({ ...DEFAULT_GAME_CONFIG, boardSize }),
		[SETTINGS_STORAGE_KEY]: JSON.stringify({
			...DEFAULT_SETTINGS,
			showTimer,
			referenceImage,
			numberedTiles,
		}),
		[RECORDS_STORAGE_KEY]: JSON.stringify({ bests } satisfies Records),
	})

	return renderWithProviders(
		<GameConfigProvider>
			<SettingsProvider>
				<RecordsProvider>
					<Play game={game} onAbandon={onAbandon} />
					{withSettingsSwitches && <SettingsSwitches />}
				</RecordsProvider>
			</SettingsProvider>
		</GameConfigProvider>,
	)
}

/** The records as they stand in storage — what a reload would read back. */
const storedBests = (): Records['bests'] => {
	const stored = readStorage([RECORDS_STORAGE_KEY])[RECORDS_STORAGE_KEY]
	if (!stored) throw new Error('The records key holds nothing')
	return (JSON.parse(stored) as Records).bests
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
 * Plays the one press between a nearly-solved board and a solved one, which is
 * how every case that needs a win gets one.
 */
const win = async (user: UserEvent): Promise<void> => {
	await user.click(firstMovableTile())
}

/**
 * Every tile, movable or not — the only buttons on the screen that carry a
 * movability state. The footer's controls and the switches carry none.
 */
const tileButtons = (): HTMLElement[] =>
	screen.getAllByRole('button').filter((button) => button.hasAttribute('aria-disabled'))

/**
 * The numbers painted on the board, ascending. A painted number is text with no
 * accessible identity of its own — which is the point of the setting — so it is
 * read off the tile rather than queried for.
 */
const paintedTileNumbers = (): number[] =>
	tileButtons()
		.map((tile) => Number(tile.textContent?.trim()))
		.filter(Boolean)
		.sort((first, second) => first - second)

/** The reference-image chip inside the footer, if it is showing. */
const previewChip = (): HTMLElement | null =>
	screen.queryByTestId(`${BOARD_TESTIDS.BASE}${BOARD_TESTIDS.PREVIEW_SUFFIX}`)

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
 *   demand. **N/A for the Best card too**, on the same reasoning and also
 *   asserted below: a record is spoken once, through the win card's
 *   description, and the number behind it reads as "Best, 42" on demand.
 *   Moves are already spoken by the Board's live region, as the tile
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

		// A player with nothing solved at this size: the card stands empty rather
		// than inventing a number to fill itself with.
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

	describe('presentational settings', () => {
		it('paints no tile numbers while Numbered tiles is off', () => {
			renderComponent({ numberedTiles: false })

			expect(paintedTileNumbers()).toHaveLength(0)
		})

		it('paints every tile its number while Numbered tiles is on', () => {
			renderComponent({ numberedTiles: true })

			// Eight tiles at 3x3, numbered as the solved picture reads.
			expect(paintedTileNumbers()).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
		})

		it('shows the reference image while it is on', () => {
			renderComponent({ referenceImage: true })

			expect(previewChip()).toBeVisible()
		})

		it('drops the reference image while it is off', () => {
			renderComponent({ referenceImage: false })

			expect(previewChip()).not.toBeInTheDocument()
		})

		// Both switches are paint. The game underneath them is the actor's, and
		// flipping one mid-play must not cost the player a move or a second.
		it('numbers the board mid-game without disturbing the game', async () => {
			const user = userEvent.setup()
			const game = startGame()
			renderComponent({ game, numberedTiles: false, withSettingsSwitches: true })
			await user.click(firstMovableTile())
			const played = game.getSnapshot()

			const numberedSwitch = screen.getByRole('button', { name: NUMBERED_SWITCH })
			await user.click(numberedSwitch)

			expect(paintedTileNumbers()).toHaveLength(tileButtons().length)
			const after = game.getSnapshot()
			expect(after.context.board).toBe(played.context.board)
			expect(after.context.moveCount).toBe(played.context.moveCount)
			expect(after.context.startedAt).toBe(played.context.startedAt)
			expect(after.value).toBe(played.value)
		})

		it('drops the reference image mid-game without disturbing the game', async () => {
			const user = userEvent.setup()
			const game = startGame()
			renderComponent({ game, referenceImage: true, withSettingsSwitches: true })
			await user.click(firstMovableTile())
			const played = game.getSnapshot()

			const referenceImageSwitch = screen.getByRole('button', {
				name: REFERENCE_IMAGE_SWITCH,
			})
			await user.click(referenceImageSwitch)

			expect(previewChip()).not.toBeInTheDocument()
			const after = game.getSnapshot()
			expect(after.context.board).toBe(played.context.board)
			expect(after.context.moveCount).toBe(played.context.moveCount)
			expect(after.context.startedAt).toBe(played.context.startedAt)
			expect(after.value).toBe(played.value)
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
	 * The records, from the screen that writes them. The game is dealt one press
	 * from solved and that press is played, so every case here records a real
	 * one-move solve — at the size the config holds, which is what a record
	 * belongs to.
	 */
	describe('the record', () => {
		const bestCard = (): HTMLElement =>
			screen.getByTestId(`${PLAY_TESTIDS.BASE}${PLAY_TESTIDS.BEST_SUFFIX}`)

		/**
		 * The card's treatment as the DOM can state it: CSS-module class names
		 * are hashed, so a tone is read as what this card carries that a plain
		 * read-out — the Moves card, neutral by definition — does not.
		 */
		const toneClasses = (): string[] => {
			const plain = [
				...screen.getByTestId(`${PLAY_TESTIDS.BASE}${PLAY_TESTIDS.MOVES_SUFFIX}`).classList,
			]
			return [...bestCard().classList].filter((name) => !plain.includes(name))
		}

		it('fills the best card the moment the solve is recorded', async () => {
			const user = userEvent.setup()
			renderComponent({ game: startNearlySolvedGame() })

			await win(user)

			const best = statValue(BEST_LABEL)
			expect(best).toHaveTextContent('01')
		})

		// The accent-tinted treatment the Solved frame draws, which only a card
		// holding a record wears.
		it('tints the best card once it holds a record', async () => {
			const user = userEvent.setup()
			renderComponent({ game: startNearlySolvedGame() })
			expect(toneClasses()).toEqual([])

			await win(user)

			expect(toneClasses()).toEqual([expect.stringContaining('accent')])
		})

		it('shows the record a returning player already holds, tinted', () => {
			renderComponent({ bests: { 3: 42 } })

			const best = statValue(BEST_LABEL)
			// Name and value together are what a screen reader reads off the
			// card: "Best, 42", the label carried by StatCard's aria-labelledby.
			expect(best).toHaveAccessibleName(BEST_LABEL)
			expect(best).toHaveTextContent('42')
			expect(toneClasses()).toEqual([expect.stringContaining('accent')])
		})

		it('writes the solve to storage, so a reload still shows it', async () => {
			const user = userEvent.setup()
			renderComponent({ game: startNearlySolvedGame() })

			await win(user)

			expect(storedBests()).toEqual({ 3: 1 })
		})

		it('replaces a record the game beat', async () => {
			const user = userEvent.setup()
			renderComponent({ bests: { 3: 5 }, game: startNearlySolvedGame() })

			await win(user)

			const best = statValue(BEST_LABEL)
			expect(best).toHaveTextContent('01')
			expect(storedBests()).toEqual({ 3: 1 })
		})

		// A tie is not a best: the run that first got there keeps it.
		it('leaves a record the game only matched', async () => {
			const user = userEvent.setup()
			renderComponent({ bests: { 3: 1 }, game: startNearlySolvedGame() })

			await win(user)

			expect(storedBests()).toEqual({ 3: 1 })
		})

		it('records nothing while the game is still being played', async () => {
			const user = userEvent.setup()
			renderComponent()

			await user.click(firstMovableTile())

			expect(storedBests()).toEqual({})
		})

		// A refresh is an unmount with the game unfinished: whatever was played
		// goes with it, and the records key is never touched.
		it('records nothing when a game in progress is left', async () => {
			const user = userEvent.setup()
			const { unmount } = renderComponent()
			await user.click(firstMovableTile())

			unmount()

			expect(storedBests()).toEqual({})
		})

		it('records nothing when the game is abandoned', async () => {
			const user = userEvent.setup()
			renderComponent()
			await user.click(boardControl(BOARD_TESTIDS.ABANDON_SUFFIX))
			const confirmation = screen.getByRole('dialog', { name: ABANDON_TITLE })
			const confirm = within(confirmation).getByRole('button', {
				name: translate(playMessages.abandonConfirm),
			})

			await user.click(confirm)

			expect(storedBests()).toEqual({})
		})

		it('records one solve once, however long the solved board stays on screen', async () => {
			const user = userEvent.setup()
			renderComponent({ bests: { 3: 5 }, game: startNearlySolvedGame() })
			await win(user)

			// Escape closes the win card to the solved board, which re-renders the
			// screen without ending the game — the cheapest second look at a solve
			// already recorded.
			await user.keyboard('{Escape}')

			expect(storedBests()).toEqual({ 3: 1 })
		})

		it('celebrates a record in the win card, alongside the time', async () => {
			const user = userEvent.setup()
			renderComponent({ game: startNearlySolvedGame(clockStoppingAt(78 * SECOND_MS)) })

			await win(user)

			const card = screen.getByRole('dialog', {
				name: translate(solvedMessages.title, { count: 1 }),
			})
			const recordLine = translate(solvedMessages.newBest, { size: 3 })
			const timeLine = translate(solvedMessages.description, { time: '01:18' })
			expect(card).toHaveAccessibleDescription(`${recordLine} ${timeLine}`)
		})

		it('claims no record for a game that only matched one', async () => {
			const user = userEvent.setup()
			renderComponent({ bests: { 3: 1 }, game: startNearlySolvedGame() })

			await win(user)

			const newBestLine = screen.queryByText(translate(solvedMessages.newBest, { size: 3 }))
			expect(newBestLine).not.toBeInTheDocument()
		})

		/**
		 * The second deliberate N/A on this screen, for the same reason as the
		 * Time card: the value stays readable on demand rather than interrupting.
		 * The record is spoken once, through the win card's description, which the
		 * case above asserts.
		 */
		it('never announces the record it just wrote', async () => {
			const user = userEvent.setup()
			renderComponent({ game: startNearlySolvedGame() })
			const announcer = screen.getByRole('status')

			await win(user)

			const card = bestCard()
			expect(card).not.toHaveAttribute('aria-live')
			expect(announcer).not.toHaveTextContent('01')
		})
	})

	/**
	 * The win: the card the solved board raises, and the two footer controls
	 * behind it. Every case is dealt a game one press from solved and plays that
	 * press, so the card counts a real game and the board's live region has
	 * already said its piece about the move that won it.
	 */
	describe('once the game is solved', () => {
		const WON_IN_ONE_MOVE = translate(solvedMessages.title, { count: 1 })
		const SOLVED_HINT = translate(playMessages.solvedHint)

		const winCard = (): HTMLElement => screen.getByRole('dialog', { name: WON_IN_ONE_MOVE })

		it('raises the win card, named by the moves the game took', async () => {
			const user = userEvent.setup()
			renderComponent({ game: startNearlySolvedGame() })

			await win(user)

			const card = winCard()
			expect(card).toBeVisible()
		})

		// Dealt a player who already holds this one-move best, so the win ties
		// rather than beats it and the description is the time line alone.
		it('describes the win with the elapsed time, frozen where the clock stopped', async () => {
			const user = userEvent.setup()
			renderComponent({
				bests: { 3: 1 },
				game: startNearlySolvedGame(clockStoppingAt(78 * SECOND_MS)),
			})

			await win(user)

			const card = winCard()
			expect(card).toHaveAccessibleDescription(
				translate(solvedMessages.description, { time: '01:18' }),
			)
		})

		it('changes the board footer line to Solved', async () => {
			const user = userEvent.setup()
			renderComponent({ game: startNearlySolvedGame() })

			await win(user)

			const hint = screen.getByText(SOLVED_HINT)
			expect(hint).toBeVisible()
		})

		/**
		 * The deliberate N/A from the ticket, asserted where both surfaces exist.
		 * The region reports the move that won the game, as it reports every
		 * other one; the win itself is the card's arrival to announce, and saying
		 * it twice is worse than saying it once.
		 */
		it('never pushes the win through the board’s live region', async () => {
			const user = userEvent.setup()
			renderComponent({ game: startNearlySolvedGame() })
			const announcer = screen.getByRole('status')

			await win(user)

			const card = winCard()
			expect(card).toBeVisible()
			expect(announcer.textContent).not.toBe('')
			expect(announcer).not.toHaveTextContent(WON_IN_ONE_MOVE)
		})

		it('closes to the solved board on Escape, footer line intact', async () => {
			const user = userEvent.setup()
			renderComponent({ game: startNearlySolvedGame() })
			await win(user)

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
			const boardSize: BoardSize = 4
			renderComponent({ boardSize, game: startNearlySolvedGame() })
			await win(user)
			const playAgain = screen.getByRole('button', {
				name: translate(solvedMessages.playAgain),
			})

			await user.click(playAgain)

			const card = screen.queryByRole('dialog')
			const grid = statValue(BOARD_SIZE_LABEL)
			const solvedHint = screen.queryByText(SOLVED_HINT)
			expect(card).not.toBeInTheDocument()
			expect(grid).toHaveTextContent(
				translate(playMessages.boardSizeValue, { rows: boardSize, cols: boardSize }),
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
			renderComponent({ game: startNearlySolvedGame() })
			await win(user)
			const trySize = screen.getByRole('button', {
				name: translate(solvedMessages.tryNextSize, { size: 4 }),
			})

			await user.click(trySize)

			const grid = statValue(BOARD_SIZE_LABEL)
			const play = screen.getByTestId(PLAY_TESTIDS.BASE)
			expect(grid).toHaveTextContent(
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
			renderComponent({ game: startNearlySolvedGame() })
			await win(user)
			await user.keyboard('{Escape}')
			await user.click(boardControl(BOARD_TESTIDS.RESTART_SUFFIX))

			await win(user)

			const card = winCard()
			expect(card).toBeVisible()
		})

		/**
		 * A solved game holds nothing worth protecting: its result is already in
		 * hand, so both controls act at once (SLI-42). Each case dismisses the
		 * win card first — it is modal, so in a browser nothing behind it can be
		 * pressed until Escape closes it to the solved board.
		 */
		describe('the footer controls behind the card', () => {
			const dismissTheCard = async (user: UserEvent): Promise<void> => {
				await win(user)
				await user.keyboard('{Escape}')
			}

			it('abandons without asking', async () => {
				const user = userEvent.setup()
				const onAbandon = vi.fn()
				renderComponent({ game: startNearlySolvedGame(), onAbandon })
				await dismissTheCard(user)

				await user.click(boardControl(BOARD_TESTIDS.ABANDON_SUFFIX))

				const confirmation = screen.queryByRole('dialog')
				expect(confirmation).not.toBeInTheDocument()
				expect(onAbandon).toHaveBeenCalledOnce()
			})

			it('restarts without asking', async () => {
				const user = userEvent.setup()
				renderComponent({ game: startNearlySolvedGame() })
				await dismissTheCard(user)
				const moves = statValue(MOVES_LABEL)
				const solvedMoves = moves.textContent

				await user.click(boardControl(BOARD_TESTIDS.RESTART_SUFFIX))

				const confirmation = screen.queryByRole('dialog')
				expect(confirmation).not.toBeInTheDocument()
				expect(moves.textContent).not.toBe(solvedMoves)
			})
		})
	})
})
