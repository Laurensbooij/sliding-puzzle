import { DEFAULT_GAME_CONFIG, GAME_CONFIG_STORAGE_KEY } from '@game-config'
import type { BoardSize, GameConfig } from '@game-config'
import { createTranslate } from '@i18n'
import { globalMessages } from '@messages'
import { RECORDS_STORAGE_KEY } from '@records'
import type { Records } from '@records'
import { readStorage, renderWithProviders, seedStorage } from '@testing'
import { screen, within } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { setupMessages } from '../../translation-messages'
import { SETUP_CONTROLS_TESTIDS } from '../SetupControls'
import { setupControlsMessages } from '../SetupControls/translation-messages'
import { setupPreviewMessages } from '../SetupPreview/translation-messages'
import { SetupDialog } from './SetupDialog'
import { SETUP_DIALOG_TESTIDS } from './constants'
import { setupDialogMessages } from './translation-messages'

const { translate } = createTranslate()

const TITLE = translate(setupDialogMessages.title)
const CLOSE_LABEL = translate(globalMessages.close)
const START_LABEL = translate(setupMessages.start)

interface SetupDialogCase {
	open?: boolean
	onClose?: () => void
	onStart?: () => void
}

/** Separate from the render helper so a case can close and reopen the same
 * tree — dismissing and reopening is what this spec asks about. */
const setupDialogElement = ({
	open = true,
	onClose = vi.fn(),
	onStart = vi.fn(),
}: SetupDialogCase = {}): ReactElement => (
	<SetupDialog open={open} onClose={onClose} onStart={onStart} />
)

/** Seeds both providers before they read, so a case starts on the state it is
 * about rather than on whatever the last one wrote. */
const renderComponent = ({
	config,
	...props
}: SetupDialogCase & { config?: Partial<GameConfig> } = {}): RenderResult => {
	seedStorage({
		[GAME_CONFIG_STORAGE_KEY]: JSON.stringify({ ...DEFAULT_GAME_CONFIG, ...config }),
		[RECORDS_STORAGE_KEY]: JSON.stringify({ bests: {} } satisfies Records),
	})

	return renderWithProviders(setupDialogElement(props), {
		providers: { gameConfig: true, records: true },
	})
}

const boardSizeGroup = () =>
	screen.getByRole('group', { name: translate(setupControlsMessages.boardSizeLabel) })

const sizeOption = (size: BoardSize) => translate(setupControlsMessages.boardSizeOption, { size })

/**
 * WCAG 2.2 AA determinations, per docs/conventions/accessibility.md.
 *
 * - Accessible name — named by its "Set up your puzzle" heading through
 *   `Modal`'s `labelledBy`, asserted below. No description: the design draws
 *   none, and each control describes itself.
 * - Keyboard — Escape closes, asserted against the `showModal` shim. The focus
 *   trap and focus restored to the opener are `showModal()`'s own; jsdom
 *   implements neither, so the Chromium stories and the manual pass carry them.
 * - Focus (SC 2.4.11) — rings belong to the controls; checked in their stories.
 * - Announcements — N/A: focus landing on the card announces the dialog, and
 *   each control announces its own state.
 * - Target size (SC 2.5.8) — ✕ is 40px, a segment 40 tall, a swatch 60 square.
 * - Contrast and reduced motion — Chromium-only, carried by the stories.
 */
describe('SetupDialog', () => {
	it('stays out of the accessibility tree until it is opened', () => {
		renderComponent({ open: false })

		const card = screen.queryByRole('dialog')
		expect(card).not.toBeInTheDocument()
	})

	it('opens as a dialog named by its heading', () => {
		renderComponent()

		const card = screen.getByRole('dialog', { name: TITLE })
		expect(card).toBeVisible()
	})

	it('heads the card with a level-2 heading, under the screen it opens over', () => {
		renderComponent()

		const heading = screen.getByRole('heading', { level: 2, name: TITLE })
		expect(heading).toBeVisible()
	})

	it('draws the preview, both choices and the call to action', () => {
		renderComponent({ config: { boardSize: 4 } })

		const card = screen.getByRole('dialog', { name: TITLE })
		const preview = within(card).getByTestId(
			`${SETUP_DIALOG_TESTIDS.BASE}${SETUP_DIALOG_TESTIDS.PREVIEW_SUFFIX}`,
		)
		const controls = within(card).getByTestId(SETUP_CONTROLS_TESTIDS.BASE)
		const start = within(card).getByRole('button', { name: START_LABEL })

		expect(preview).toBeVisible()
		expect(controls).toBeVisible()
		expect(start).toBeVisible()
	})

	it('asks to be closed when the ✕ is pressed', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()
		renderComponent({ onClose })
		const close = screen.getByRole('button', { name: CLOSE_LABEL })

		await user.click(close)

		expect(onClose).toHaveBeenCalledOnce()
	})

	it('asks to be closed on Escape', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()
		renderComponent({ onClose })

		await user.keyboard('{Escape}')

		expect(onClose).toHaveBeenCalledOnce()
	})

	// `scrimClose` on, matching SettingsDialog: every choice is already written
	// through, so a click beside the card loses nothing.
	it('asks to be closed on a scrim click', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()
		renderComponent({ onClose })
		const card = screen.getByRole('dialog', { name: TITLE })

		await user.click(card)

		expect(onClose).toHaveBeenCalledOnce()
	})

	// The dialog element paints nothing; its own box would otherwise read as a
	// scrim click and dismiss the card the player just aimed at.
	it('ignores a click on the card’s own padding', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()
		renderComponent({ onClose })
		const card = screen.getByTestId(
			`${SETUP_DIALOG_TESTIDS.BASE}${SETUP_DIALOG_TESTIDS.CARD_SUFFIX}`,
		)

		await user.click(card)

		expect(onClose).not.toHaveBeenCalled()
	})

	it('reports the start of a game without deciding where that leads', async () => {
		const user = userEvent.setup()
		const onStart = vi.fn()
		renderComponent({ onStart })
		const start = screen.getByRole('button', { name: START_LABEL })

		await user.click(start)

		expect(onStart).toHaveBeenCalledOnce()
	})

	// The ✕ dismisses, it does not discard — which is why the design draws no
	// Cancel: every choice was written through the moment it was made.
	it('keeps a choice made in it after it is dismissed and reopened', async () => {
		const user = userEvent.setup()
		const { rerender } = renderComponent({ config: { boardSize: 3 } })
		const fiveByFive = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(5) })

		const close = screen.getByRole('button', { name: CLOSE_LABEL })

		await user.click(fiveByFive)
		await user.click(close)
		rerender(setupDialogElement({ open: false }))
		rerender(setupDialogElement({ open: true }))

		const reopened = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(5) })
		const stored = readStorage([GAME_CONFIG_STORAGE_KEY])
		expect(reopened).toBeChecked()
		expect(stored[GAME_CONFIG_STORAGE_KEY]).toContain('"boardSize":5')
	})

	it('follows the chosen size on the board it previews', async () => {
		const user = userEvent.setup()
		renderComponent({ config: { boardSize: 3 } })

		const fourByFour = within(boardSizeGroup()).getByRole('radio', { name: sizeOption(4) })
		await user.click(fourByFour)

		const preview = screen.getByRole('group', {
			name: translate(setupPreviewMessages.label, { size: 4 }),
		})
		expect(preview).toBeVisible()
	})

	it('tags the card, the ✕ and the board it previews', () => {
		renderComponent()

		const card = screen.getByTestId(
			`${SETUP_DIALOG_TESTIDS.BASE}${SETUP_DIALOG_TESTIDS.CARD_SUFFIX}`,
		)
		const close = screen.getByTestId(
			`${SETUP_DIALOG_TESTIDS.BASE}${SETUP_DIALOG_TESTIDS.CLOSE_SUFFIX}`,
		)
		const preview = screen.getByTestId(
			`${SETUP_DIALOG_TESTIDS.BASE}${SETUP_DIALOG_TESTIDS.PREVIEW_SUFFIX}`,
		)

		expect(card).toBeVisible()
		expect(close).toBeVisible()
		expect(preview).toBeVisible()
	})
})
