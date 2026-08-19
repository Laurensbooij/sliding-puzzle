import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, SettingsProvider } from '@/lib/settings'
import { IconButton } from '@components/IconButton'
import { createTranslate } from '@i18n'
import { globalMessages } from '@messages'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import type { FC } from 'react'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

import { SettingsDialog } from './SettingsDialog'
import type { SettingsDialogProps } from './SettingsDialog'
import styles from './SettingsDialog.stories.module.css'
import { SETTINGS_DIALOG_TESTIDS } from './constants'
import { settingsDialogMessages } from './translation-messages'

const { translate } = createTranslate()

const TITLE = translate(settingsDialogMessages.title)
const CLOSE_LABEL = translate(globalMessages.close)
const GEAR_LABEL = 'Settings'

const REFERENCE_IMAGE_TESTID = `${SETTINGS_DIALOG_TESTIDS.BASE}${SETTINGS_DIALOG_TESTIDS.REFERENCE_IMAGE_SUFFIX}`

/**
 * The two frames Figma draws, by width. The card is one composition at both —
 * same head, same three rows, same order — so the only thing a viewport changes
 * is where its 480px width gets capped (ADR-0016).
 */
const VIEWPORTS = {
	mobile: { name: 'Mobile (Figma 390)', styles: { width: '390px', height: '844px' } },
	desktop: { name: 'Desktop (Figma 1000)', styles: { width: '1000px', height: '680px' } },
}

/** The screen the card covers — the only way to see the scrim's 3px blur work. */
const PageBehind: FC = () => (
	<div className={styles.page}>
		<h1 className={styles.heading}>Eight tiles, one gap.</h1>
		<p>Slide the glass pieces back into order.</p>
	</div>
)

/**
 * The provider the card writes through. Keyed per story so each one re-hydrates
 * from the seeded storage rather than inheriting the flips of the story before
 * it — the whole point of this provider is that it persists.
 */
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
	// Every story opens on the defaults a first-time player has: reference image
	// on, numbers off, timer on — which is also the only combination that shows
	// both switch states at once.
	beforeEach: () => {
		localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS))
	},
	decorators: [withSettings],
} satisfies Meta<typeof SettingsDialog>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Figma `5 · Settings` at 1000: the card at its full 480 width, centred over the
 * blurred screen. Three rows, the middle one off — Figma draws no other
 * combination, and none of them changes the layout.
 *
 * The hint row Figma draws under the switches is deliberately absent; see the
 * component docblock for what that costs and why it is accepted.
 */
export const Desktop: Story = {
	globals: { viewport: { value: 'desktop' } },
}

/**
 * Figma `5 · Settings — mobile` at 390: the same card, capped to the viewport
 * less its 16px gutters. Nothing about the tree moves across the breakpoint.
 */
export const Mobile: Story = {
	globals: { viewport: { value: 'mobile' } },
}

/**
 * The ✕'s ring, reached by a real Tab so `:focus-visible` actually matches. It
 * is the card's first stop, and the check that a ring on the head row clears the
 * card's own edge (SC 2.4.11) — the dialog UA sheet puts `overflow: auto` on the
 * element, which `Modal` has to undo for exactly this reason.
 */
export const CloseFocused: Story = {
	globals: { viewport: { value: 'desktop' } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const close = canvas.getByRole('button', { name: CLOSE_LABEL })
		await userEvent.tab()

		await expect(close).toHaveFocus()
	},
}

/**
 * The second stop: the first switch. Its ring sits on a page-coloured spacer,
 * which is why it is worth seeing over the card surface rather than the page
 * the `Switch` stories use.
 */
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

/** The card's own props. The harness overrides `open` and `onClose` below. */
type TriggeredSettingsProps = SettingsDialogProps

/**
 * The gear and the card, wired the way `AppShell` wires them: one `useState`,
 * the opener passed to the header, the card rendered beside the screen. A plain
 * `IconButton` stands in for `AppHeader` — a widget may not import another one.
 */
const TriggeredSettings: FC<TriggeredSettingsProps> = (props) => {
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
			<SettingsDialog {...props} open={open} onClose={() => setOpen(false)} />
		</>
	)
}

/**
 * The half jsdom cannot answer. Opening for real in Chromium is the standing
 * check on everything `showModal()` supplies and the shim in `vitest.setup.ts`
 * deliberately does not: the top layer, the inert page behind it, and focus
 * restored to the gear on the way out.
 *
 * It flips a switch while open, so the write-through is seen against a real
 * `aria-checked`. It dismisses through the ✕ rather than Escape or the scrim:
 * Escape is the browser's own close watcher and a synthetic key never reaches
 * it, and `::backdrop` is not an element `userEvent` can aim at. Both are
 * covered in the spec against the shim, and by the manual pass.
 */
export const OpensFromTheGear: Story = {
	args: { open: false },
	globals: { viewport: { value: 'desktop' } },
	render: (args) => <TriggeredSettings {...args} />,
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
