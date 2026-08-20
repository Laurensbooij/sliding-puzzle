import { DEFAULT_LOCALE, LOCALE_ENDONYMS, createTranslate } from '@i18n'
import { globalMessages } from '@messages'
import { SETTINGS_STORAGE_KEY } from '@settings'
import type { Settings } from '@settings'
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
const LANGUAGE_LABEL = translate(settingsDialogMessages.languageLabel)

const TESTID_SUFFIXES = [
	SETTINGS_DIALOG_TESTIDS.CLOSE_SUFFIX,
	SETTINGS_DIALOG_TESTIDS.REFERENCE_IMAGE_SUFFIX,
	SETTINGS_DIALOG_TESTIDS.NUMBERED_TILES_SUFFIX,
	SETTINGS_DIALOG_TESTIDS.SHOW_TIMER_SUFFIX,
	SETTINGS_DIALOG_TESTIDS.LANGUAGE_SUFFIX,
]

const ALL_OFF: Settings = {
	referenceImage: false,
	numberedTiles: false,
	showTimer: false,
	locale: DEFAULT_LOCALE,
}
const ALL_ON: Settings = {
	referenceImage: true,
	numberedTiles: true,
	showTimer: true,
	locale: DEFAULT_LOCALE,
}

interface SettingsDialogCase {
	open?: boolean
	onClose?: () => void
	/** What the player's browser already holds; left alone if omitted. */
	stored?: Settings
}

/** Separate from the render helper so a case can re-render or re-mount the same
 * tree — reopening vs. reloading are two things this spec tells apart. */
const settingsDialogElement = ({
	open = true,
	onClose = vi.fn(),
}: Omit<SettingsDialogCase, 'stored'> = {}): ReactElement => (
	<SettingsDialog open={open} onClose={onClose} />
)

/** Seeds storage only when a case asks — remount cases need storage to hold
 * exactly what was written, not a stale default. */
const renderComponent = (
	{ stored, ...props }: SettingsDialogCase = {},
	options?: RenderWithProvidersOptions,
): RenderResult => {
	if (stored) seedStorage({ [SETTINGS_STORAGE_KEY]: JSON.stringify(stored) })

	return renderWithProviders(settingsDialogElement(props), {
		...options,
		providers: { settings: true },
	})
}

/**
 * WCAG 2.2 AA determinations, per docs/conventions/accessibility.md.
 *
 * - Accessible name — named by the "Settings" heading via `Modal`'s
 *   `labelledBy`. No description: each switch describes itself.
 * - Keyboard — Escape closes (asserted against the `showModal` shim); every
 *   control is a native button/checkbox. Trap and focus restore are
 *   `showModal()`'s own, checked in the Chromium stories.
 * - Focus (SC 2.4.11) — rings belong to `IconButton`/`Switch`; checked in the
 *   focus stories.
 * - Announcements — N/A twice: focus landing announces the dialog,
 *   `aria-checked` announces each switch. Asserted as no live region below.
 * - Target size (SC 2.5.8) — ✕ is 40px; a switch's target is its 44×26 track
 *   plus label. Both clear 24px.
 * - Contrast and reduced motion — Chromium-only, carried by the stories.
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

	// The five controls an e2e test would aim at.
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
			stored: {
				referenceImage: false,
				numberedTiles: true,
				showTimer: false,
				locale: DEFAULT_LOCALE,
			},
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

	// A remount is what a page reload looks like — proves the write reached
	// storage, not just React state.
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

	// Against `Dialog`'s default: dismissing Settings loses nothing.
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

	// `aria-checked` on the focused control announces the flip already.
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

	it('offers every language the app ships, named in its own language', () => {
		renderComponent()

		const picker = screen.getByRole('combobox', { name: LANGUAGE_LABEL })
		const offered = screen.getAllByRole('option').map((option) => option.textContent)

		expect(picker).toBeVisible()
		expect(offered).toEqual(Object.values(LOCALE_ENDONYMS))
	})

	it('opens on the language the player last stored', () => {
		renderComponent({ stored: { ...ALL_ON, locale: 'nl' } })

		const picker = screen.getByRole('combobox', { name: LANGUAGE_LABEL })
		expect(picker).toHaveValue('nl')
	})

	// Endonyms, not translations: the way back out of a language you cannot
	// read. Rendering under `nl` is what makes this falsifiable — a translated
	// list would read "Engels" here.
	it('names the options the same whichever language is active', () => {
		renderComponent({}, { locale: 'nl' })

		const offered = screen.getAllByRole('option').map((option) => option.textContent)
		expect(offered).toEqual(Object.values(LOCALE_ENDONYMS))
	})

	it('reopens on the language chosen before the page was reloaded', async () => {
		const user = userEvent.setup()
		const { unmount } = renderComponent()
		const picker = screen.getByRole('combobox', { name: LANGUAGE_LABEL })

		await user.selectOptions(picker, 'nl')
		unmount()
		renderComponent()

		const reloaded = screen.getByRole('combobox', { name: LANGUAGE_LABEL })
		expect(reloaded).toHaveValue('nl')
	})

	it('leaves the display preferences alone when the language changes', async () => {
		const user = userEvent.setup()
		renderComponent({ stored: ALL_ON })
		const picker = screen.getByRole('combobox', { name: LANGUAGE_LABEL })

		await user.selectOptions(picker, 'nl')

		const switches = screen.getAllByRole('switch')
		for (const control of switches) expect(control).toBeChecked()
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
