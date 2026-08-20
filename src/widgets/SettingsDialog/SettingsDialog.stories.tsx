import { IconButton } from '@components/IconButton'
import { createTranslate } from '@i18n'
import { globalMessages } from '@messages'
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, SettingsProvider } from '@settings'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import type { FC } from 'react'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

import { SettingsDialog } from './SettingsDialog'
import styles from './SettingsDialog.stories.module.css'
import { SETTINGS_DIALOG_TESTIDS } from './constants'
import { settingsDialogMessages } from './translation-messages'

const { translate } = createTranslate()

const TITLE = translate(settingsDialogMessages.title)
const CLOSE_LABEL = translate(globalMessages.close)
const REFERENCE_IMAGE_LABEL = translate(settingsDialogMessages.referenceImageLabel)
const NUMBERED_TILES_LABEL = translate(settingsDialogMessages.numberedTilesLabel)
const SHOW_TIMER_LABEL = translate(settingsDialogMessages.showTimerLabel)
const GEAR_LABEL = 'Settings'

const REFERENCE_IMAGE_TESTID = `${SETTINGS_DIALOG_TESTIDS.BASE}${SETTINGS_DIALOG_TESTIDS.REFERENCE_IMAGE_SUFFIX}`

/** The two frames Figma draws, by width — same composition at both (ADR-0016). */
const VIEWPORTS = {
	mobile: { name: 'Mobile (Figma 390)', styles: { width: '390px', height: '844px' } },
	desktop: { name: 'Desktop (Figma 1000)', styles: { width: '1000px', height: '680px' } },
}

/** The screen behind the card, so the scrim's blur has something to show. */
const PageBehind: FC = () => (
	<div className={styles.page}>
		<h1 className={styles.heading}>Eight tiles, one gap.</h1>
		<p>Slide the glass pieces back into order.</p>
	</div>
)

/** Keyed per story so each re-hydrates from seeded storage, not the last story's flips. */
const withSettings: Decorator = (Story, context) => (
	<>
		<PageBehind />
		<SettingsProvider key={context.id}>
			<Story />
		</SettingsProvider>
	</>
)

const meta = {
	title: 'Widgets/SettingsDialog',
	component: SettingsDialog,
	args: { open: true, onClose: fn() },
	parameters: {
		layout: 'fullscreen',
		viewport: { options: VIEWPORTS },
	},
	// Every story opens on the defaults — also the only combination showing
	// both an on and an off switch.
	beforeEach: () => {
		localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS))
	},
	decorators: [withSettings],
} satisfies Meta<typeof SettingsDialog>

export default meta
type Story = StoryObj<typeof meta>

/** No switch state changes the layout, so the defaults are the only case to cover. */
const assertDefaults: NonNullable<Story['play']> = async ({ canvasElement }) => {
	const canvas = within(canvasElement)
	const referenceImage = canvas.getByRole('switch', { name: REFERENCE_IMAGE_LABEL })
	const numberedTiles = canvas.getByRole('switch', { name: NUMBERED_TILES_LABEL })
	const showTimer = canvas.getByRole('switch', { name: SHOW_TIMER_LABEL })

	await expect(referenceImage).toBeChecked()
	await expect(numberedTiles).not.toBeChecked()
	await expect(showTimer).toBeChecked()
}

/** Figma `5 · Settings` at 1000. Hint row dropped — see the component docblock. */
export const Desktop: Story = {
	globals: { viewport: { value: 'desktop' } },
	play: assertDefaults,
}

/** Figma `5 · Settings — mobile` at 390, capped to the viewport's 16px gutters. */
export const Mobile: Story = {
	globals: { viewport: { value: 'mobile' } },
	play: assertDefaults,
}

/** The ✕'s ring, reached by a real Tab — checks it clears the card's own edge (SC 2.4.11). */
export const CloseFocused: Story = {
	globals: { viewport: { value: 'desktop' } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const close = canvas.getByRole('button', { name: CLOSE_LABEL })
		await userEvent.tab()

		await expect(close).toHaveFocus()
	},
}

/** The second stop: the first switch, whose ring sits on a page-coloured spacer. */
export const SwitchFocused: Story = {
	globals: { viewport: { value: 'desktop' } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const referenceImage = canvas.getByTestId(REFERENCE_IMAGE_TESTID)
		await userEvent.tab()
		await userEvent.tab()

		await expect(referenceImage).toHaveFocus()
	},
}

/** Wired like `AppShell`. A plain `IconButton` stands in for `AppHeader` — a
 * widget may not import another one. */
const TriggeredSettings: FC = () => {
	const [open, setOpen] = useState(false)

	return (
		<>
			<IconButton
				icon="settings"
				label={GEAR_LABEL}
				variant="ghost"
				tooltipPlacement="bottom"
				onClick={() => setOpen(true)}
			/>
			<SettingsDialog open={open} onClose={() => setOpen(false)} />
		</>
	)
}

/**
 * What jsdom can't answer: the top layer, inert background, and focus
 * restored to the gear — real `showModal()` behaviour.
 *
 * Dismisses through the ✕, not Escape or the scrim: Escape needs the
 * browser's own close watcher, and `::backdrop` has no element to target.
 * Both are covered in the jsdom spec's shim, and by the manual pass.
 */
export const OpensFromTheGear: Story = {
	args: { open: false },
	globals: { viewport: { value: 'desktop' } },
	render: () => <TriggeredSettings />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const gear = canvas.getByRole('button', { name: GEAR_LABEL })
		await userEvent.click(gear)

		const card = await canvas.findByRole('dialog', { name: TITLE })
		await waitFor(() => expect(card).toBeVisible())

		// Focus starts on the card, so its name is read before any control.
		await expect(card).toHaveFocus()
		await expect(card.matches(':modal')).toBe(true)

		// Asked for focus directly, the gear behind the scrim refuses it — that
		// is the browser's containment, which `userEvent.tab()` knows nothing
		// about because it walks the DOM's own focusable order.
		gear.focus()
		await expect(card).toHaveFocus()

		const numberedTiles = canvas.getByRole('switch', {
			name: translate(settingsDialogMessages.numberedTilesLabel),
		})
		await expect(numberedTiles).not.toBeChecked()
		await userEvent.click(numberedTiles)
		await expect(numberedTiles).toBeChecked()

		const close = canvas.getByRole('button', { name: CLOSE_LABEL })
		await userEvent.click(close)

		await waitFor(() => expect(card).not.toBeVisible())
		await expect(gear).toHaveFocus()
	},
}
