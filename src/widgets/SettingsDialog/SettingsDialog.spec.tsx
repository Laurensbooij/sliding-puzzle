import { SETTINGS_STORAGE_KEY, SettingsProvider } from '@/lib/settings'
import type { Settings } from '@/lib/settings'
import { createTranslate } from '@i18n'
import { globalMessages } from '@messages'
import { renderWithProviders, seedStorage } from '@testing'
import type { RenderWithProvidersOptions } from '@testing'
import { screen } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { SettingsDialog } from './SettingsDialog'
import { SETTINGS_DIALOG_TESTIDS } from './constants'
import { settingsDialogMessages } from './translation-messages'

const { translate } = createTranslate()

const TITLE = translate(settingsDialogMessages.title)
const CLOSE_LABEL = translate(globalMessages.close)
const REFERENCE_IMAGE_LABEL = translate(settingsDialogMessages.referenceImageLabel)
const NUMBERED_TILES_LABEL = translate(settingsDialogMessages.numberedTilesLabel)
const SHOW_TIMER_LABEL = translate(settingsDialogMessages.showTimerLabel)

const TESTID_SUFFIXES = [
	SETTINGS_DIALOG_TESTIDS.CLOSE_SUFFIX,
	SETTINGS_DIALOG_TESTIDS.REFERENCE_IMAGE_SUFFIX,
	SETTINGS_DIALOG_TESTIDS.NUMBERED_TILES_SUFFIX,
	SETTINGS_DIALOG_TESTIDS.SHOW_TIMER_SUFFIX,
]

const ALL_OFF: Settings = { referenceImage: false, numberedTiles: false, showTimer: false }
const ALL_ON: Settings = { referenceImage: true, numberedTiles: true, showTimer: true }

interface SettingsDialogCase {
	open?: boolean
	onClose?: () => void
	/** What the player's browser already holds. Left alone when a case omits it. */
	stored?: Settings
}

/**
 * Kept separate from the render helper so a case can re-render or re-mount the
 * same tree — reopening the card and reloading the page are two things this
 * spec has to tell apart.
 */
const settingsDialogElement = ({
	open = true,
	onClose = vi.fn(),
}: Omit<SettingsDialogCase, 'stored'> = {}): ReactElement => (
	<SettingsProvider>
		<SettingsDialog open={open} onClose={onClose} />
	</SettingsProvider>
)

/**
 * The provider hydrates from storage on mount, so a case states the player's
 * stored preferences the way their browser would rather than clicking its way
 * to them. Seeding only when a case asks keeps the remount cases honest: after
 * a write, what is in storage is the whole point.
 */
const renderComponent = (
	{ stored, ...props }: SettingsDialogCase = {},
	options?: RenderWithProvidersOptions,
): RenderResult => {
	if (stored) seedStorage({ [SETTINGS_STORAGE_KEY]: JSON.stringify(stored) })

	return renderWithProviders(settingsDialogElement(props), options)
}

/**
 * WCAG 2.2 AA determinations, per docs/conventions/accessibility.md.
 *
 * - Accessible name — the card is named by its "Settings" heading through
 *   `Modal`'s `labelledBy`, asserted below. It takes no description: the design
 *   draws no supporting line, and each switch describes itself.
 * - Keyboard — Escape asks to close (asserted here against the `showModal`
 *   shim), and every control is a native button or checkbox, so Tab and Space
 *   are the browser's own. The focus trap and focus restored to the gear belong
 *   to `showModal()` and are checked in Chromium, in the stories beside this.
 * - Focus (SC 2.4.11) — every ring belongs to `IconButton` or `Switch`. The card
 *   overlays nothing and clips nothing, which the focus stories are the check on.
 * - Announcements — N/A twice over. The card announces itself by taking focus,
 *   and each switch announces its own flip through `aria-checked` on the focused
 *   control. Asserted below as the absence of a live region.
 * - Target size (SC 2.5.8) — the ✕ is a 40px `IconButton`, and a switch's target
 *   is its 44×26 track plus the label beside it; both clear 24px.
 * - Contrast and reduced motion — Chromium-only checks, carried by the stories.
 */
describe('SettingsDialog', () => {
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

	it('heads the card with a level-2 heading, under whatever screen it opens over', () => {
		renderComponent()

		const heading = screen.getByRole('heading', { level: 2, name: TITLE })
		expect(heading).toBeVisible()
	})

	it('shows the three preferences in the designed order', () => {
		renderComponent()

		const switches = screen.getAllByRole('switch')
		expect(switches).toEqual([
			screen.getByRole('switch', { name: REFERENCE_IMAGE_LABEL }),
			screen.getByRole('switch', { name: NUMBERED_TILES_LABEL }),
			screen.getByRole('switch', { name: SHOW_TIMER_LABEL }),
		])
	})

	// The four controls an end-to-end test would aim at, each reachable by testid.
	it('tags every control it draws', () => {
		renderComponent()

		const tagged = TESTID_SUFFIXES.map((suffix) =>
			screen.getByTestId(`${SETTINGS_DIALOG_TESTIDS.BASE}${suffix}`),
		)

		expect(tagged).toHaveLength(TESTID_SUFFIXES.length)
	})

	it('opens on the defaults a first-time player has', () => {
		renderComponent()

		const referenceImage = screen.getByRole('switch', { name: REFERENCE_IMAGE_LABEL })
		const numberedTiles = screen.getByRole('switch', { name: NUMBERED_TILES_LABEL })
		const showTimer = screen.getByRole('switch', { name: SHOW_TIMER_LABEL })

		expect(referenceImage).toBeChecked()
		expect(numberedTiles).not.toBeChecked()
		expect(showTimer).toBeChecked()
	})

	it('opens on the preferences the player last stored', () => {
		renderComponent({
			stored: { referenceImage: false, numberedTiles: true, showTimer: false },
		})

		const referenceImage = screen.getByRole('switch', { name: REFERENCE_IMAGE_LABEL })
		const numberedTiles = screen.getByRole('switch', { name: NUMBERED_TILES_LABEL })
		const showTimer = screen.getByRole('switch', { name: SHOW_TIMER_LABEL })

		expect(referenceImage).not.toBeChecked()
		expect(numberedTiles).toBeChecked()
		expect(showTimer).not.toBeChecked()
	})

	it.each([REFERENCE_IMAGE_LABEL, NUMBERED_TILES_LABEL, SHOW_TIMER_LABEL])(
		'turns %s on the moment it is pressed',
		async (label) => {
			const user = userEvent.setup()
			renderComponent({ stored: ALL_OFF })
			const control = screen.getByRole('switch', { name: label })

			await user.click(control)

			expect(control).toBeChecked()
		},
	)

	it.each([REFERENCE_IMAGE_LABEL, NUMBERED_TILES_LABEL, SHOW_TIMER_LABEL])(
		'turns %s off the moment it is pressed again',
		async (label) => {
			const user = userEvent.setup()
			renderComponent({ stored: ALL_ON })
			const control = screen.getByRole('switch', { name: label })

			await user.click(control)

			expect(control).not.toBeChecked()
		},
	)

	it('leaves the other two preferences alone when one is flipped', async () => {
		const user = userEvent.setup()
		renderComponent({ stored: ALL_OFF })
		const numberedTiles = screen.getByRole('switch', { name: NUMBERED_TILES_LABEL })
		const referenceImage = screen.getByRole('switch', { name: REFERENCE_IMAGE_LABEL })
		const showTimer = screen.getByRole('switch', { name: SHOW_TIMER_LABEL })

		await user.click(numberedTiles)

		expect(referenceImage).not.toBeChecked()
		expect(showTimer).not.toBeChecked()
	})

	it('describes the two preferences the design gives a supporting line', () => {
		renderComponent()

		const referenceImage = screen.getByRole('switch', { name: REFERENCE_IMAGE_LABEL })
		const numberedTiles = screen.getByRole('switch', { name: NUMBERED_TILES_LABEL })

		expect(referenceImage).toHaveAccessibleDescription(
			translate(settingsDialogMessages.referenceImageDescription),
		)
		expect(numberedTiles).toHaveAccessibleDescription(
			translate(settingsDialogMessages.numberedTilesDescription),
		)
	})

	it('leaves the timer preference undescribed, as the design draws it', () => {
		renderComponent()

		const showTimer = screen.getByRole('switch', { name: SHOW_TIMER_LABEL })
		expect(showTimer).toHaveAccessibleDescription('')
	})

	it('reopens on a change made the last time it was open', async () => {
		const user = userEvent.setup()
		const { rerender } = renderComponent()
		const numberedTiles = screen.getByRole('switch', { name: NUMBERED_TILES_LABEL })

		await user.click(numberedTiles)
		rerender(settingsDialogElement({ open: false }))
		rerender(settingsDialogElement({ open: true }))

		const reopened = screen.getByRole('switch', { name: NUMBERED_TILES_LABEL })
		expect(reopened).toBeChecked()
	})

	// A remount is what a page reload looks like from here, and it is the only
	// way to see the write actually reach storage rather than React state.
	it('reopens on a change made before the page was reloaded', async () => {
		const user = userEvent.setup()
		const { unmount } = renderComponent()
		const showTimer = screen.getByRole('switch', { name: SHOW_TIMER_LABEL })

		await user.click(showTimer)
		unmount()
		renderComponent()

		const reloaded = screen.getByRole('switch', { name: SHOW_TIMER_LABEL })
		expect(reloaded).not.toBeChecked()
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

	// Against `Modal`'s default and against `Dialog`: dismissing Settings loses
	// nothing, while dismissing a confirmation decides something.
	it('asks to be closed on a scrim click', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()
		renderComponent({ onClose })
		const card = screen.getByRole('dialog', { name: TITLE })

		await user.click(card)

		expect(onClose).toHaveBeenCalledOnce()
	})

	// The dialog element paints nothing, so the padding and the row gaps belong to
	// the card inside it. Were they the shell's own, `Modal` would read a click on
	// them as a scrim click and dismiss the card the player just aimed at.
	it('ignores a click on the card’s own padding', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()
		renderComponent({ onClose })
		const card = screen.getByTestId(
			`${SETTINGS_DIALOG_TESTIDS.BASE}${SETTINGS_DIALOG_TESTIDS.CARD_SUFFIX}`,
		)

		await user.click(card)

		expect(onClose).not.toHaveBeenCalled()
	})

	it('ignores a drag that starts on a switch and is released on the scrim', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()
		renderComponent({ onClose })
		const card = screen.getByRole('dialog', { name: TITLE })
		const numberedTiles = screen.getByRole('switch', { name: NUMBERED_TILES_LABEL })

		await user.pointer([
			{ target: numberedTiles, keys: '[MouseLeft>]' },
			{ target: card, keys: '[/MouseLeft]' },
		])

		expect(onClose).not.toHaveBeenCalled()
	})

	it('draws the ✕ and no action row — the design has none', () => {
		renderComponent()

		const controls = screen.getAllByRole('button')
		expect(controls).toHaveLength(1)
		expect(controls[0]).toHaveAccessibleName(CLOSE_LABEL)
	})

	// Each switch announces its own flip through `aria-checked` on the focused
	// control; a live region saying the same thing would double-speak.
	it('adds no live region of its own', async () => {
		const user = userEvent.setup()
		renderComponent()
		const card = screen.getByRole('dialog', { name: TITLE })
		const showTimer = screen.getByRole('switch', { name: SHOW_TIMER_LABEL })

		await user.click(showTimer)

		// An absent live region has no accessible identity to query for, so the
		// attribute is the only fact there is to assert.
		// eslint-disable-next-line testing-library/no-node-access
		const liveRegion = card.querySelector('[aria-live]')
		const status = screen.queryByRole('status')

		expect(liveRegion).toBeNull()
		expect(status).not.toBeInTheDocument()
	})

	it('names itself and its preferences in the active locale', () => {
		const { translate: translateDutch } = createTranslate('nl')
		renderComponent({}, { locale: 'nl' })

		const card = screen.getByRole('dialog', {
			name: translateDutch(settingsDialogMessages.title),
		})
		const referenceImage = screen.getByRole('switch', {
			name: translateDutch(settingsDialogMessages.referenceImageLabel),
		})

		expect(card).toBeVisible()
		expect(referenceImage).toBeVisible()
	})
})
