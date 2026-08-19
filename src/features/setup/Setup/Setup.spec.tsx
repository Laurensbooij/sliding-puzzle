import { DEFAULT_GAME_CONFIG, GAME_CONFIG_STORAGE_KEY, GameConfigProvider } from '@/lib/game-config'
import type { BoardSize, GameConfig } from '@/lib/game-config'
import { RECORDS_STORAGE_KEY, RecordsProvider } from '@/lib/records'
import type { Records } from '@/lib/records'
import { createTranslate } from '@i18n'
import { globalMessages } from '@messages'
import { renderWithProviders, seedStorage, setDesktopViewport } from '@testing'
import { act, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Setup } from './Setup'
import { SETUP_CONTROLS_TESTIDS } from './components/SetupControls'
import { setupControlsMessages } from './components/SetupControls/translation-messages'
import { SETUP_DIALOG_TESTIDS } from './components/SetupDialog'
import { setupDialogMessages } from './components/SetupDialog/translation-messages'
import { setupPreviewMessages } from './components/SetupPreview/translation-messages'
import { SETUP_TESTIDS } from './constants'
import { setupMessages } from './translation-messages'

const { translate } = createTranslate()

const START_LABEL = translate(setupMessages.start)
const DIALOG_TITLE = translate(setupDialogMessages.title)
const CLOSE_LABEL = translate(globalMessages.close)

interface SetupCase {
	/** Which side of `--breakpoint-desktop` the render happens on. */
	desktop?: boolean
	/** Seeded into the config key before the providers read it. */
	config?: Partial<GameConfig>
	/** Seeded into the records key before the providers read it. */
	bests?: Records['bests']
}

/**
 * Renders Setup under the two providers it reads through, on the viewport the
 * case is about. Storage is seeded first so the providers start on the state
 * the case is about — which is the same route a returning player takes.
 */
const renderComponent = ({ desktop = false, config, bests }: SetupCase = {}) => {
	seedStorage({
		[GAME_CONFIG_STORAGE_KEY]: JSON.stringify({ ...DEFAULT_GAME_CONFIG, ...config }),
		[RECORDS_STORAGE_KEY]: JSON.stringify({ bests: bests ?? {} } satisfies Records),
	})
	setDesktopViewport(desktop)
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
	screen.getByRole('group', { name: translate(setupControlsMessages.boardSizeLabel) })

const sizeOption = (size: BoardSize) => translate(setupControlsMessages.boardSizeOption, { size })

/** The one control the mobile page draws, and the one the dialog opens with. */
const startButton = () => screen.getByRole('button', { name: START_LABEL })

/**
 * WCAG 2.2 AA determinations, per docs/conventions/accessibility.md.
 *
 * - Accessible name — the screen is titled by its `<h1>`; the trigger keeps the
 *   call to action's own label and says `aria-haspopup="dialog"`, which is what
 *   closes the gap between what it is called and what it does.
 * - Keyboard — the trigger is a native button; the dialog's trap, Escape and
 *   focus restoration are `showModal()`'s, covered in `SetupDialog`.
 * - Focus (SC 2.4.3) — crossing to desktop with the dialog up would drop focus
 *   on `<body>`; it moves to the now-inline GRID SIZE control instead, asserted
 *   below.
 * - Announcements — N/A: focus landing on the card announces the dialog, and
 *   every choice is made through a radio the platform announces.
 * - Target size (SC 2.5.8) — the trigger is a 48px `lg` button.
 * - Contrast and reduced motion — Chromium-only, carried by the stories.
 */
describe('Setup', () => {
	it('is titled by the fixed tagline, whatever board size is chosen', () => {
		renderComponent({ config: { boardSize: 6 } })

		const heading = screen.getByRole('heading', {
			level: 1,
			name: translate(setupMessages.heading),
		})

		expect(heading).toBeVisible()
	})

	it.each([
		['mobile', false],
		['desktop', true],
	])('names the preview board after the picture and the chosen size on %s', (_, desktop) => {
		renderComponent({ desktop, config: { boardSize: 4 } })

		const preview = screen.getByRole('group', {
			name: translate(setupPreviewMessages.label, { size: 4 }),
		})

		expect(preview).toBeVisible()
	})

	it('gives the preview board no tab stop of its own — it is decoration here', async () => {
		const user = userEvent.setup()
		renderComponent()
		const previewTiles = within(
			screen.getByTestId(`${SETUP_TESTIDS.BASE}${SETUP_TESTIDS.PREVIEW_SUFFIX}`),
		).getAllByRole('button')

		await user.tab()

		const start = startButton()
		expect(start).toHaveFocus()
		for (const tile of previewTiles) expect(tile).not.toHaveFocus()
	})

	describe('on desktop', () => {
		it('puts the choices on the page, with no dialog anywhere', () => {
			renderComponent({ desktop: true })

			const controls = screen.getByTestId(SETUP_CONTROLS_TESTIDS.BASE)
			const dialog = screen.queryByRole('dialog')

			expect(controls).toBeVisible()
			expect(dialog).not.toBeInTheDocument()
		})

		it('starts the game straight from the page', async () => {
			const user = userEvent.setup()
			const { onStart } = renderComponent({ desktop: true })
			const start = startButton()

			await user.click(start)

			expect(onStart).toHaveBeenCalledOnce()
		})

		it('repaints the preview board when another board size is chosen', async () => {
			const user = userEvent.setup()
			renderComponent({ desktop: true })

			const fourByFour = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(4) })
			await user.click(fourByFour)

			const preview = screen.getByRole('group', {
				name: translate(setupPreviewMessages.label, { size: 4 }),
			})
			expect(preview).toBeVisible()
		})
	})

	describe('on mobile', () => {
		// The closed dialog keeps its controls mounted — `Modal` renders its
		// children either way — but a closed `<dialog>` is hidden, so they are out
		// of the accessibility tree and out of the tab order until it opens.
		it('keeps the choices out of reach until they are asked for', () => {
			renderComponent()

			const sizes = screen.queryByRole('group', {
				name: translate(setupControlsMessages.boardSizeLabel),
			})
			const dialog = screen.queryByRole('dialog')

			expect(sizes).not.toBeInTheDocument()
			expect(dialog).not.toBeInTheDocument()
		})

		// The label stays the call to action's; `haspopup` is what says the press
		// opens something rather than starting a game.
		it('keeps the call to action’s label on the button that opens the dialog', () => {
			renderComponent()

			const start = startButton()

			expect(start).toHaveAttribute('aria-haspopup', 'dialog')
		})

		it('opens the dialog on the button, without starting a game', async () => {
			const user = userEvent.setup()
			const { onStart } = renderComponent()
			const start = startButton()

			await user.click(start)

			const dialog = screen.getByRole('dialog', { name: DIALOG_TITLE })
			expect(dialog).toBeVisible()
			expect(onStart).not.toHaveBeenCalled()
		})

		it('mounts one copy of the choices, inside the dialog', async () => {
			const user = userEvent.setup()
			renderComponent()

			await user.click(startButton())

			const dialog = screen.getByRole('dialog', { name: DIALOG_TITLE })
			const controls = screen.getAllByTestId(SETUP_CONTROLS_TESTIDS.BASE)
			const sizeGroups = screen.getAllByRole('group', {
				name: translate(setupControlsMessages.boardSizeLabel),
			})
			expect(controls).toHaveLength(1)
			expect(sizeGroups).toHaveLength(1)
			expect(dialog).toContainElement(controls[0] ?? null)
		})

		it('starts the game from the dialog’s own call to action', async () => {
			const user = userEvent.setup()
			const { onStart } = renderComponent()
			await user.click(startButton())

			const dialog = screen.getByRole('dialog', { name: DIALOG_TITLE })
			const startInDialog = within(dialog).getByRole('button', { name: START_LABEL })
			await user.click(startInDialog)

			expect(onStart).toHaveBeenCalledOnce()
		})

		it('takes the choices away again when the dialog is dismissed, keeping them made', async () => {
			const user = userEvent.setup()
			renderComponent({ config: { boardSize: 3 } })
			await user.click(startButton())

			const fiveByFive = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(5) })
			await user.click(fiveByFive)
			const close = screen.getByRole('button', { name: CLOSE_LABEL })
			await user.click(close)

			const dialog = screen.queryByRole('dialog')
			const preview = screen.getByRole('group', {
				name: translate(setupPreviewMessages.label, { size: 5 }),
			})
			expect(dialog).not.toBeInTheDocument()
			expect(preview).toBeVisible()
		})
	})

	describe('across the breakpoint', () => {
		it('moves focus to the grid size when the dialog gives way to the page', async () => {
			const user = userEvent.setup()
			renderComponent({ config: { boardSize: 5 } })
			await user.click(startButton())

			act(() => {
				setDesktopViewport(true)
			})

			const chosenSize = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(5) })
			const dialog = screen.queryByRole('dialog')
			// Left alone, focus would drop to <body> when the dialog unmounted.
			expect(dialog).not.toBeInTheDocument()
			expect(chosenSize).toHaveFocus()
		})

		it('does not reopen the dialog on the way back to mobile', async () => {
			const user = userEvent.setup()
			renderComponent()
			await user.click(startButton())

			act(() => {
				setDesktopViewport(true)
			})
			act(() => {
				setDesktopViewport(false)
			})

			const dialog = screen.queryByRole('dialog')
			const start = startButton()
			expect(dialog).not.toBeInTheDocument()
			expect(start).toHaveAttribute('aria-haspopup', 'dialog')
		})

		it('keeps the choices across the crossover, because the config holds them', async () => {
			const user = userEvent.setup()
			renderComponent({ config: { boardSize: 3 } })
			await user.click(startButton())
			const sixBySix = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(6) })
			await user.click(sixBySix)

			act(() => {
				setDesktopViewport(true)
			})

			const stillChosen = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(6) })
			expect(stillChosen).toBeChecked()
		})
	})

	it('exposes a testid for the screen, its preview and the mobile trigger', async () => {
		const user = userEvent.setup()
		renderComponent()

		const screenRoot = screen.getByTestId(SETUP_TESTIDS.BASE)
		const preview = screen.getByTestId(`${SETUP_TESTIDS.BASE}${SETUP_TESTIDS.PREVIEW_SUFFIX}`)
		const start = screen.getByTestId(`${SETUP_TESTIDS.BASE}${SETUP_TESTIDS.TRIGGER_SUFFIX}`)
		await user.click(start)

		const card = screen.getByTestId(
			`${SETUP_DIALOG_TESTIDS.BASE}${SETUP_DIALOG_TESTIDS.CARD_SUFFIX}`,
		)
		expect(screenRoot).toBeVisible()
		expect(preview).toBeVisible()
		expect(start).toBeVisible()
		expect(card).toBeVisible()
	})
})
