import { Button } from '@components/Button'
import { createTranslate } from '@i18n'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { FC } from 'react'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { Dialog } from './Dialog'
import type { DialogProps } from './Dialog'
import styles from './Dialog.stories.module.css'
import { dialogMessages } from './translation-messages'

const { translate } = createTranslate()

const TRIGGER_LABEL = 'Abandon this game'
const CONFIRM_TITLE = 'Abandon this game?'

/** The card the confirm kind is drawn with, reused by three stories. */
const confirmArgs = {
	kind: 'confirm',
	title: CONFIRM_TITLE,
	description: 'Your moves so far will not be recorded.',
	actions: (
		<>
			<Button variant="danger" iconStart="x">
				Abandon
			</Button>
			<Button variant="ghost">Keep playing</Button>
		</>
	),
} satisfies Partial<DialogProps>

/** The page the card covers — the only way to see the scrim's 3px blur work. */
const PageBehind: FC = () => (
	<div className={styles.page}>
		<p>Moves 42 · 03:18</p>
		<div className={styles.grid}>
			{Array.from({ length: 8 }, (_, index) => (
				<div key={index} className={styles.cell}>
					{index + 1}
				</div>
			))}
		</div>
	</div>
)

const meta = {
	title: 'Components/Dialog',
	component: Dialog,
	args: {
		open: true,
		kind: 'win',
		title: 'Solved in 42 moves',
		description: 'A new best at 4×4.',
		onClose: () => {},
	},
	decorators: [
		(Story) => (
			<>
				<PageBehind />
				<Story />
			</>
		),
	],
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The celebration. Its actions are the pair Figma draws: one primary that
 * repeats the game, one ghost that changes it — and the ghost is what dismisses
 * the card, which is why the set draws no close affordance.
 */
export const Win: Story = {
	args: {
		actions: (
			<>
				<Button variant="primary" iconStart="rotate-ccw">
					Play again
				</Button>
				<Button variant="ghost">Try 5 × 5</Button>
			</>
		),
	},
}

/**
 * The question. Danger leads, because it is what the user came here to do;
 * `Keep playing` is the ghost that backs out. Nothing destructive is one Enter
 * away on arrival — see the component docblock on where focus lands.
 */
export const Confirm: Story = {
	args: confirmArgs,
}

/**
 * The close control, which the Figma set does not draw. Off by default for
 * exactly that reason — this is what a card whose every action commits to
 * something would look like.
 */
export const Dismissible: Story = {
	args: { ...confirmArgs, dismissible: true },
}

/**
 * Every ring at once, forced rather than tabbed — a real Tab can only land on
 * one control, and this story exists to show all of them clearing the card's
 * edge. The dialog UA sheet puts `overflow: auto` on the card, the same
 * clipping box that once ate Tooltip's hover bridge, so "the indicator is not
 * obscured" (SC 2.4.11) is a claim that needs looking at rather than assuming.
 *
 * The card itself takes no ring; see the component docblock.
 */
export const FocusedActions: Story = {
	args: { ...confirmArgs, dismissible: true },
	parameters: { pseudo: { focusVisible: true } },
}

/**
 * The wrapping case. A 400px card gives a 28px title about four words a line,
 * and two long labels do not fit one row of pills — the action row wraps rather
 * than squeezing the buttons under their own padding.
 */
export const LongCopy: Story = {
	args: {
		kind: 'confirm',
		title: 'Leave this game and start a different source image?',
		description:
			'Your current board, your move count and the running timer are all discarded. Nothing here is recoverable once you continue.',
		actions: (
			<>
				<Button variant="danger" iconStart="x">
					Discard and choose another image
				</Button>
				<Button variant="ghost">Keep playing this board</Button>
			</>
		),
	},
}

/** The card's own props. The harness overrides `open` and `onClose` below. */
type TriggeredDialogProps = DialogProps

/**
 * Opens and closes for real. Takes the story's args whole and overrides `open`
 * and `onClose` — the point of this harness is that the card's owner drives
 * both, which is exactly what a static story cannot show.
 */
const TriggeredDialog: FC<TriggeredDialogProps> = (props) => {
	const [open, setOpen] = useState(false)

	return (
		<>
			<Button variant="secondary" onClick={() => setOpen(true)}>
				{TRIGGER_LABEL}
			</Button>
			<Dialog {...props} open={open} onClose={() => setOpen(false)} />
		</>
	)
}

/**
 * The half jsdom cannot answer. Opening for real in Chromium is the standing
 * check on everything `showModal()` supplies and the shim in `vitest.setup.ts`
 * deliberately does not: the top layer, the inert page behind, and focus
 * restored to the trigger on the way out. The scroll lock and the initial focus
 * move are the two hand-added pieces riding along.
 *
 * It dismisses through the close control rather than Escape, which is why this
 * story turns that control on. Escape is the browser's close watcher, and a
 * synthetic key event never reaches it — the spec's Esc case runs against the
 * shim, which models it explicitly.
 */
export const OpensFromATrigger: Story = {
	args: { ...confirmArgs, dismissible: true },
	render: (args) => <TriggeredDialog {...args} />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const trigger = canvas.getByRole('button', { name: TRIGGER_LABEL })
		await userEvent.click(trigger)

		const dialog = await canvas.findByRole('dialog', { name: CONFIRM_TITLE })
		await waitFor(() => expect(dialog).toBeVisible())

		// Focus starts on the card, so the title and description are read before
		// any control.
		await expect(dialog).toHaveFocus()
		await expect(document.body).toHaveStyle({ overflow: 'hidden' })

		// In the top layer, with the page behind it inert. Asked for focus
		// directly, the trigger refuses it and the card keeps it — that is the
		// browser's containment, not something this component polices.
		// `userEvent.tab()` cannot show the same thing: it walks the DOM's own
		// focusable order and knows nothing about inertness, so it would step
		// straight out of the card and pass.
		await expect(dialog.matches(':modal')).toBe(true)
		trigger.focus()
		await expect(trigger).not.toHaveFocus()
		await expect(dialog).toHaveFocus()

		const close = canvas.getByRole('button', { name: translate(dialogMessages.close) })
		await userEvent.click(close)

		await waitFor(() => expect(dialog).not.toBeVisible())
		await expect(trigger).toHaveFocus()
		await expect(document.body).not.toHaveStyle({ overflow: 'hidden' })
	},
}
