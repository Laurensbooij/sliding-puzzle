import { Button } from '@components/Button'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { FC, ReactNode } from 'react'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { Modal } from './Modal'
import type { ModalProps } from './Modal'
import styles from './Modal.stories.module.css'

const TRIGGER_LABEL = 'Open settings'
const TITLE = 'Settings'
const TITLE_ID = 'modal-story-title'
const DESCRIPTION_ID = 'modal-story-description'
const DISMISS_LABEL = 'Done'

/** The page the shell covers — the only way to see the scrim's 3px blur work. */
const PageBehind: FC = () => (
	<div className={styles.page}>
		<p>Moves 42 · 03:18</p>
	</div>
)

/** Stand-in for a designed card — deliberately not `Dialog`, since these
 * stories are about the shell rather than any one card. */
const DemoCard: FC<{ children?: ReactNode }> = ({ children }) => (
	<div className={styles.card}>
		<h2 id={TITLE_ID} className={styles.title}>
			{TITLE}
		</h2>
		<p id={DESCRIPTION_ID} className={styles.description}>
			Sound, reduced motion and the tile numbers, each remembered between games.
		</p>
		<div className={styles.actions}>{children}</div>
	</div>
)

const meta = {
	title: 'Components/Modal',
	component: Modal,
	args: {
		open: true,
		labelledBy: TITLE_ID,
		describedBy: DESCRIPTION_ID,
		onClose: () => {},
		children: (
			<DemoCard>
				<Button variant="primary">{DISMISS_LABEL}</Button>
			</DemoCard>
		),
	},
	decorators: [
		(Story) => (
			<>
				<PageBehind />
				<Story />
			</>
		),
	],
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

/** The shell centring its content over the blurred scrim, and nothing more. */
export const Default: Story = {}

/** Checks the shell's `overflow: auto` doesn't clip focus rings inside it
 * (SC 2.4.11) — the same clipping box that once ate Tooltip's hover bridge. */
export const FocusedContent: Story = {
	parameters: { pseudo: { focusVisible: true } },
}

/** The shell's own props. The harness overrides `open` and `onClose` below. */
type TriggeredModalProps = ModalProps

/** Opens and closes for real — the shell's owner drives `open`, `onClose`
 * and the card, which a static story can't show. */
const TriggeredModal: FC<TriggeredModalProps> = (props) => {
	const [open, setOpen] = useState(false)

	return (
		<>
			<Button variant="secondary" onClick={() => setOpen(true)}>
				{TRIGGER_LABEL}
			</Button>
			<Modal {...props} open={open} onClose={() => setOpen(false)}>
				<DemoCard>
					<Button variant="primary" onClick={() => setOpen(false)}>
						{DISMISS_LABEL}
					</Button>
				</DemoCard>
			</Modal>
		</>
	)
}

/**
 * The standing check on what `showModal()` supplies and jsdom can't: the top
 * layer, the inert page behind, and focus restored to the trigger. Dismisses
 * through a control rather than Escape — a synthetic key event never reaches
 * the browser's close watcher.
 */
export const OpensFromATrigger: Story = {
	render: (args) => <TriggeredModal {...args} />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const trigger = canvas.getByRole('button', { name: TRIGGER_LABEL })
		await userEvent.click(trigger)

		const modal = await canvas.findByRole('dialog', { name: TITLE })
		await waitFor(() => expect(modal).toBeVisible())

		await expect(modal).toHaveFocus()
		await expect(document.body).toHaveStyle({ overflow: 'hidden' })

		// The trigger can't steal focus back — the browser's containment.
		await expect(modal.matches(':modal')).toBe(true)
		trigger.focus()
		await expect(trigger).not.toHaveFocus()
		await expect(modal).toHaveFocus()

		const dismiss = canvas.getByRole('button', { name: DISMISS_LABEL })
		await userEvent.click(dismiss)

		await waitFor(() => expect(modal).not.toBeVisible())
		await expect(trigger).toHaveFocus()
		await expect(document.body).not.toHaveStyle({ overflow: 'hidden' })
	},
}

/**
 * The opt-in scrim close. Checked here rather than in the spec because the
 * `target === dialog element` attribution needs a real `::backdrop` and real
 * hit testing, which jsdom has neither of.
 */
export const ScrimClose: Story = {
	args: { scrimClose: true },
	render: (args) => <TriggeredModal {...args} />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const trigger = canvas.getByRole('button', { name: TRIGGER_LABEL })
		await userEvent.click(trigger)

		const modal = await canvas.findByRole('dialog', { name: TITLE })
		const title = canvas.getByRole('heading', { name: TITLE })

		// The top-left corner is scrim: the card is centred and 400px wide.
		await expect(document.elementFromPoint(2, 2)).toBe(modal)

		// A press that starts on the card and releases outside it — same click
		// target as the scrim, so only the press origin keeps the modal up.
		// Checks the `open` attribute rather than `toBeVisible()`: the open
		// transition fades in over --dur-medium, and a CSS-derived visibility
		// check can race that fade — the attribute can't.
		await userEvent.pointer([
			{ target: title, keys: '[MouseLeft>]' },
			{ target: modal, keys: '[/MouseLeft]' },
		])
		await expect(modal).toHaveAttribute('open')

		await userEvent.click(modal)
		await waitFor(() => expect(modal).not.toBeVisible())
		await expect(trigger).toHaveFocus()
	},
}
