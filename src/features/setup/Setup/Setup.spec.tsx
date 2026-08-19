import { DEFAULT_GAME_CONFIG, GAME_CONFIG_STORAGE_KEY, GameConfigProvider } from '@/lib/game-config'
import type { BoardSize, GameConfig } from '@/lib/game-config'
import { RECORDS_STORAGE_KEY, RecordsProvider } from '@/lib/records'
import type { Records } from '@/lib/records'
import { createTranslate } from '@i18n'
import { readStorage, renderWithProviders, seedStorage } from '@testing'
import { screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Setup } from './Setup'
import { SOURCE_IMAGE_CHOICE_TESTIDS } from './components/SourceImageChoice'
import {
	sourceImageChoiceMessages,
	sourceImageNameMessages,
} from './components/SourceImageChoice/translation-messages'
import { SETUP_TESTIDS } from './constants'
import { setupMessages } from './translation-messages'

const { translate } = createTranslate()

interface SetupCase {
	/** Seeded into the config key before the providers read it. */
	config?: Partial<GameConfig>
	/** Seeded into the records key before the providers read it. */
	bests?: Records['bests']
}

/**
 * Renders Setup under the two providers it reads through, seeding storage first
 * so the providers start on the state the case is about — which is the same
 * route a returning player takes.
 */
const renderComponent = ({ config, bests }: SetupCase = {}) => {
	seedStorage({
		[GAME_CONFIG_STORAGE_KEY]: JSON.stringify({ ...DEFAULT_GAME_CONFIG, ...config }),
		[RECORDS_STORAGE_KEY]: JSON.stringify({ bests: bests ?? {} } satisfies Records),
	})
	const onStart = vi.fn()

	const view = renderWithProviders(
		<GameConfigProvider>
			<RecordsProvider>
				<Setup onStart={onStart} />
			</RecordsProvider>
		</GameConfigProvider>,
	)

	return { ...view, onStart }
}

const boardSizeGroup = () =>
	screen.getByRole('group', { name: translate(setupMessages.boardSizeLabel) })

const sourceImageGroup = () => screen.getByTestId(SOURCE_IMAGE_CHOICE_TESTIDS.BASE)

const sizeOption = (size: BoardSize) => translate(setupMessages.boardSizeOption, { size })

describe('Setup', () => {
	it('is titled by the fixed tagline, whatever board size is chosen', () => {
		renderComponent({ config: { boardSize: 6 } })

		const heading = screen.getByRole('heading', {
			level: 1,
			name: translate(setupMessages.heading),
		})

		expect(heading).toBeVisible()
	})

	it('names the preview board after the picture and the chosen size', () => {
		renderComponent({ config: { boardSize: 4 } })

		const preview = screen.getByRole('group', {
			name: translate(setupMessages.previewLabel, { size: 4 }),
		})

		expect(preview).toBeVisible()
	})

	it('names both choice groups and the call to action', () => {
		renderComponent()

		const sizes = boardSizeGroup()
		const sourceImages = screen.getByRole('group', {
			name: translate(sourceImageChoiceMessages.legend),
		})
		const start = screen.getByRole('button', { name: translate(setupMessages.start) })

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

	it('repaints the preview board when another board size is chosen', async () => {
		const user = userEvent.setup()
		renderComponent()

		const fourByFour = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(4) })
		await user.click(fourByFour)

		const preview = screen.getByRole('group', {
			name: translate(setupMessages.previewLabel, { size: 4 }),
		})
		expect(preview).toBeVisible()
	})

	it('repaints the preview board when another artwork is chosen', async () => {
		const user = userEvent.setup()
		renderComponent()

		const rocket = within(sourceImageGroup()).getByRole('radio', {
			name: translate(sourceImageNameMessages.rocket),
		})
		await user.click(rocket)

		const chosen = within(sourceImageGroup()).getByRole('radio', {
			name: translate(sourceImageNameMessages.rocket),
		})
		const stored = readStorage([GAME_CONFIG_STORAGE_KEY])
		// The chosen artwork reaches the board through the config the board reads,
		// so asserting the write is asserting the repaint — which drawing lands on
		// the tiles is a Chromatic question, not a jsdom one.
		expect(chosen).toBeChecked()
		expect(stored[GAME_CONFIG_STORAGE_KEY]).toContain('rocket')
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
		// providers re-read the key and Setup reads back from them.
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

		const record = screen.getByText(translate(setupMessages.recordEmpty, { size: 3 }))

		expect(record).toBeVisible()
	})

	it('draws the record when one exists for the chosen size', () => {
		renderComponent({ config: { boardSize: 3 }, bests: { 3: 42 } })

		const record = screen.getByText(translate(setupMessages.recordBest, { size: 3, moves: 42 }))

		expect(record).toBeVisible()
	})

	it('follows the chosen board size from a record to an empty one', async () => {
		const user = userEvent.setup()
		renderComponent({ config: { boardSize: 3 }, bests: { 3: 42 } })

		const fourByFour = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(4) })
		await user.click(fourByFour)

		const record = screen.getByText(translate(setupMessages.recordEmpty, { size: 4 }))
		const previous = screen.queryByText(
			translate(setupMessages.recordBest, { size: 3, moves: 42 }),
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
			translate(setupMessages.recordBest, { size: 5, moves: 128 }),
		)
		expect(record).toBeVisible()
	})

	it('reports the start of a game without deciding where that leads', async () => {
		const user = userEvent.setup()
		const { onStart } = renderComponent()

		const start = screen.getByRole('button', { name: translate(setupMessages.start) })
		await user.click(start)

		expect(onStart).toHaveBeenCalledOnce()
	})

	it('gives each choice group one tab stop and the preview board none', async () => {
		const user = userEvent.setup()
		renderComponent()

		const chosenSize = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(3) })
		const chosenSourceImage = within(sourceImageGroup()).getByRole('radio', {
			name: translate(sourceImageNameMessages.sailboat),
		})
		const start = screen.getByRole('button', { name: translate(setupMessages.start) })
		const previewTiles = within(
			screen.getByTestId(`${SETUP_TESTIDS.BASE}${SETUP_TESTIDS.PREVIEW_SUFFIX}`),
		).getAllByRole('button')

		await user.tab()
		expect(chosenSize).toHaveFocus()

		await user.tab()
		expect(chosenSourceImage).toHaveFocus()

		await user.tab()
		expect(start).toHaveFocus()

		// The board is decoration here, so nothing in it was ever reached.
		for (const tile of previewTiles) expect(tile).not.toHaveFocus()
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

	it('exposes a testid per control and per swatch', () => {
		renderComponent()

		const screenRoot = screen.getByTestId(SETUP_TESTIDS.BASE)
		const sizes = screen.getByTestId(`${SETUP_TESTIDS.BASE}${SETUP_TESTIDS.BOARD_SIZE_SUFFIX}`)
		const record = screen.getByTestId(`${SETUP_TESTIDS.BASE}${SETUP_TESTIDS.RECORD_SUFFIX}`)
		const start = screen.getByTestId(`${SETUP_TESTIDS.BASE}${SETUP_TESTIDS.START_SUFFIX}`)
		const swatch = screen.getByTestId(
			`${SOURCE_IMAGE_CHOICE_TESTIDS.BASE}${SOURCE_IMAGE_CHOICE_TESTIDS.SWATCH_SUFFIX}-cat`,
		)

		expect(screenRoot).toBeVisible()
		expect(sizes).toBeVisible()
		expect(record).toBeVisible()
		expect(start).toBeVisible()
		expect(swatch).toBeInTheDocument()
	})
})
