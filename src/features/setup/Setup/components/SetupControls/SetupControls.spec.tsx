import { DEFAULT_GAME_CONFIG, GAME_CONFIG_STORAGE_KEY, GameConfigProvider } from '@/lib/game-config'
import type { BoardSize, GameConfig } from '@/lib/game-config'
import { RECORDS_STORAGE_KEY, RecordsProvider } from '@/lib/records'
import type { Records } from '@/lib/records'
import { createTranslate } from '@i18n'
import { readStorage, renderWithProviders, seedStorage } from '@testing'
import { screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import type { RefObject } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { SOURCE_IMAGE_CHOICE_TESTIDS } from '../SourceImageChoice'
import {
	sourceImageChoiceMessages,
	sourceImageNameMessages,
} from '../SourceImageChoice/translation-messages'
import { SetupControls } from './SetupControls'
import type { SetupControlsHandle } from './SetupControls'
import { SETUP_CONTROLS_TESTIDS } from './constants'
import { setupControlsMessages } from './translation-messages'

const { translate } = createTranslate()

interface SetupControlsCase {
	/** Seeded into the config key before the providers read it. */
	config?: Partial<GameConfig>
	/** Seeded into the records key before the providers read it. */
	bests?: Records['bests']
	/** Handed the focus handle, for the case that drives it. */
	handleRef?: RefObject<SetupControlsHandle | null>
}

/**
 * Renders the controls under the two providers they read through, seeding
 * storage first so the providers start on the state the case is about — which
 * is the same route a returning player takes.
 */
const renderComponent = ({ config, bests, handleRef }: SetupControlsCase = {}) => {
	seedStorage({
		[GAME_CONFIG_STORAGE_KEY]: JSON.stringify({ ...DEFAULT_GAME_CONFIG, ...config }),
		[RECORDS_STORAGE_KEY]: JSON.stringify({ bests: bests ?? {} } satisfies Records),
	})
	const onStart = vi.fn()

	const view = renderWithProviders(
		<GameConfigProvider>
			<RecordsProvider>
				<SetupControls ref={handleRef} onStart={onStart} />
			</RecordsProvider>
		</GameConfigProvider>,
	)

	return { ...view, onStart }
}

const boardSizeGroup = () =>
	screen.getByRole('group', { name: translate(setupControlsMessages.boardSizeLabel) })

const sourceImageGroup = () => screen.getByTestId(SOURCE_IMAGE_CHOICE_TESTIDS.BASE)

const sizeOption = (size: BoardSize) => translate(setupControlsMessages.boardSizeOption, { size })

/**
 * WCAG 2.2 AA determinations, per docs/conventions/accessibility.md.
 *
 * - Accessible name — both choices are named groups, the action names itself.
 * - Keyboard — one tab stop per group and arrow keys within it, asserted below;
 *   both come from the native radios the two controls are built on.
 * - Focus (SC 2.4.11) — rings belong to `SegmentedControl` and
 *   `SourceImageChoice`; checked in their own focus stories.
 * - Announcements — N/A: every change is made through a radio, which the
 *   platform announces. Asserted as the absence of a live region below.
 * - Target size (SC 2.5.8) — a segment is 40 tall, a swatch 60 square.
 * - Contrast and reduced motion — Chromium-only, carried by the stories.
 */
describe('SetupControls', () => {
	it('names both choice groups and the call to action', () => {
		renderComponent()

		const sizes = boardSizeGroup()
		const sourceImages = screen.getByRole('group', {
			name: translate(sourceImageChoiceMessages.legend),
		})
		const start = screen.getByRole('button', { name: translate(setupControlsMessages.start) })

		expect(sizes).toBeVisible()
		expect(sourceImages).toBeVisible()
		expect(start).toBeVisible()
	})

	it('offers every board size, checking the chosen one', () => {
		renderComponent({ config: { boardSize: 5 } })

		const options = within(boardSizeGroup()).getAllByRole('radio')
		const chosen = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(5) })

		expect(options).toHaveLength(4)
		expect(chosen).toBeChecked()
	})

	it('offers every artwork by what it draws, checking the chosen one', () => {
		renderComponent({ config: { sourceImage: 'bike' } })

		const swatches = within(sourceImageGroup()).getAllByRole('radio')
		const chosen = within(sourceImageGroup()).getByRole('radio', {
			name: translate(sourceImageNameMessages.bike),
		})

		expect(swatches).toHaveLength(6)
		expect(chosen).toBeChecked()
	})

	it('writes both choices straight through to the persisted config', async () => {
		const user = userEvent.setup()
		renderComponent()

		const sixBySix = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(6) })
		await user.click(sixBySix)
		const cat = within(sourceImageGroup()).getByRole('radio', {
			name: translate(sourceImageNameMessages.cat),
		})
		await user.click(cat)

		const stored = readStorage([GAME_CONFIG_STORAGE_KEY])
		expect(stored[GAME_CONFIG_STORAGE_KEY]).toBe(
			JSON.stringify({ boardSize: 6, sourceImage: 'cat' } satisfies GameConfig),
		)
	})

	it('reopens on the stored choices after a reload', () => {
		const { unmount } = renderComponent({ config: { boardSize: 5, sourceImage: 'flower' } })
		unmount()

		// A second mount over the same storage is what a reload amounts to: the
		// providers re-read the key and the controls read back from them.
		renderComponent({ config: { boardSize: 5, sourceImage: 'flower' } })

		const size = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(5) })
		const chosenImage = within(sourceImageGroup()).getByRole('radio', {
			name: translate(sourceImageNameMessages.flower),
		})
		expect(size).toBeChecked()
		expect(chosenImage).toBeChecked()
	})

	it('leaves neighbouring storage keys alone when a choice is written', async () => {
		const user = userEvent.setup()
		const seeded = seedStorage({ 'sliding-puzzle.settings.v1': '{"sound":true}' })
		renderComponent()

		const fiveByFive = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(5) })
		await user.click(fiveByFive)

		const stored = readStorage(Object.keys(seeded))
		expect(stored).toStrictEqual(seeded)
	})

	it('draws the designed empty state when no record exists for the chosen size', () => {
		renderComponent({ config: { boardSize: 3 } })

		const record = screen.getByText(translate(setupControlsMessages.recordEmpty, { size: 3 }))

		expect(record).toBeVisible()
	})

	it('draws the record when one exists for the chosen size', () => {
		renderComponent({ config: { boardSize: 3 }, bests: { 3: 42 } })

		const record = screen.getByText(
			translate(setupControlsMessages.recordBest, { size: 3, moves: 42 }),
		)

		expect(record).toBeVisible()
	})

	it('follows the chosen board size from a record to an empty one', async () => {
		const user = userEvent.setup()
		renderComponent({ config: { boardSize: 3 }, bests: { 3: 42 } })

		const fourByFour = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(4) })
		await user.click(fourByFour)

		const record = screen.getByText(translate(setupControlsMessages.recordEmpty, { size: 4 }))
		const previous = screen.queryByText(
			translate(setupControlsMessages.recordBest, { size: 3, moves: 42 }),
		)
		expect(record).toBeVisible()
		expect(previous).not.toBeInTheDocument()
	})

	it('follows the chosen board size from an empty line to a record', async () => {
		const user = userEvent.setup()
		renderComponent({ config: { boardSize: 3 }, bests: { 5: 128 } })

		const fiveByFive = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(5) })
		await user.click(fiveByFive)

		const record = screen.getByText(
			translate(setupControlsMessages.recordBest, { size: 5, moves: 128 }),
		)
		expect(record).toBeVisible()
	})

	it('reports the start of a game without deciding where that leads', async () => {
		const user = userEvent.setup()
		const { onStart } = renderComponent()

		const start = screen.getByRole('button', { name: translate(setupControlsMessages.start) })
		await user.click(start)

		expect(onStart).toHaveBeenCalledOnce()
	})

	it('gives each choice group one tab stop, then the action', async () => {
		const user = userEvent.setup()
		renderComponent()

		const chosenSize = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(3) })
		const chosenSourceImage = within(sourceImageGroup()).getByRole('radio', {
			name: translate(sourceImageNameMessages.sailboat),
		})
		const start = screen.getByRole('button', { name: translate(setupControlsMessages.start) })

		await user.tab()
		expect(chosenSize).toHaveFocus()

		await user.tab()
		expect(chosenSourceImage).toHaveFocus()

		await user.tab()
		expect(start).toHaveFocus()
	})

	it.each<[string, BoardSize, BoardSize]>([
		['{ArrowRight}', 3, 4],
		['{ArrowLeft}', 4, 3],
		['{ArrowLeft}', 3, 6],
		['{ArrowRight}', 6, 3],
	])('moves the board size with %s from %s to %s', async (key, from, to) => {
		const user = userEvent.setup()
		renderComponent({ config: { boardSize: from } })

		await user.tab()
		await user.keyboard(key)

		const moved = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(to) })
		expect(moved).toBeChecked()
	})

	it.each<[string, 'sailboat' | 'flower' | 'rocket']>([
		['{ArrowRight}', 'rocket'],
		['{ArrowLeft}', 'flower'],
	])('moves the artwork with %s to %s, wrapping at the ends', async (key, expected) => {
		const user = userEvent.setup()
		renderComponent({ config: { sourceImage: 'sailboat' } })

		await user.tab()
		await user.tab()
		await user.keyboard(key)

		const moved = within(sourceImageGroup()).getByRole('radio', {
			name: translate(sourceImageNameMessages[expected]),
		})
		expect(moved).toBeChecked()
	})

	it('keeps the two groups independent, so one choice never moves the other', async () => {
		const user = userEvent.setup()
		renderComponent()

		const fourByFour = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(4) })
		await user.click(fourByFour)

		const sourceImageStillChosen = within(sourceImageGroup()).getByRole('radio', {
			name: translate(sourceImageNameMessages.sailboat),
		})
		const checkedEverywhere = screen.getAllByRole('radio', { checked: true })
		expect(sourceImageStillChosen).toBeChecked()
		expect(checkedEverywhere).toHaveLength(2)
	})

	it('announces every change through the native radios, with no live region', async () => {
		const user = userEvent.setup()
		renderComponent()

		const fourByFour = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(4) })
		await user.click(fourByFour)

		const statusRegion = screen.queryByRole('status')
		const alertRegion = screen.queryByRole('alert')

		// N/A for aria-live: the radio that caused the change is announced by the
		// platform, and a live region on the lines it updates would double-announce.
		expect(statusRegion).not.toBeInTheDocument()
		expect(alertRegion).not.toBeInTheDocument()
	})

	it('hands the screen a way to focus the chosen board size', () => {
		const handleRef: RefObject<SetupControlsHandle | null> = { current: null }
		renderComponent({ config: { boardSize: 5 }, handleRef })

		const chosen = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(5) })
		handleRef.current?.focusBoardSize()

		// The chosen segment, not the first one: a radio group's checked option is
		// its only tab stop, so that is where tabbing in would have landed.
		expect(chosen).toHaveFocus()
	})

	it('exposes a testid per control', () => {
		renderComponent()

		const base = screen.getByTestId(SETUP_CONTROLS_TESTIDS.BASE)
		const sizes = screen.getByTestId(
			`${SETUP_CONTROLS_TESTIDS.BASE}${SETUP_CONTROLS_TESTIDS.BOARD_SIZE_SUFFIX}`,
		)
		const record = screen.getByTestId(
			`${SETUP_CONTROLS_TESTIDS.BASE}${SETUP_CONTROLS_TESTIDS.RECORD_SUFFIX}`,
		)
		const start = screen.getByTestId(
			`${SETUP_CONTROLS_TESTIDS.BASE}${SETUP_CONTROLS_TESTIDS.START_SUFFIX}`,
		)
		const swatch = screen.getByTestId(
			`${SOURCE_IMAGE_CHOICE_TESTIDS.BASE}${SOURCE_IMAGE_CHOICE_TESTIDS.SWATCH_SUFFIX}-cat`,
		)

		expect(base).toBeVisible()
		expect(sizes).toBeVisible()
		expect(record).toBeVisible()
		expect(start).toBeVisible()
		expect(swatch).toBeInTheDocument()
	})
})
