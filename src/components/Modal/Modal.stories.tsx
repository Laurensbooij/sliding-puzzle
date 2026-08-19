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

/**
 * A stand-in for a designed card. The shell paints nothing, so every story
 * needs something inside it to look at — and this is deliberately not `Dialog`:
 * these stories are about the shell, and what a card does with the space is the
 * card's business.
 */
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

/**
 * The shell doing its whole visible job: centring what it is given over the
 * blurred scrim, and adding nothing of its own. Every pixel here except the
 * scrim belongs to the card inside.
 */
export const Default: Story = {}

/**
 * The rings the shell must not clip. The dialog UA sheet puts `overflow: auto`
 * on the element, the same clipping box that once ate Tooltip's hover bridge,
 * so "the indicator is not obscured" (SC 2.4.11) is a claim that needs looking
 * at rather than assuming.
 *
 * The shell itself takes no ring; see the component docblock.
 */
export const FocusedContent: Story = {
	parameters: { pseudo: { focusVisible: true } },
}

/** The shell's own props. The harness overrides `open` and `onClose` below. */
type TriggeredModalProps = ModalProps

/**
 * Opens and closes for real. Takes the story's args whole and overrides `open`,
 * `onClose` and the card — the point of this harness is that the shell's owner
 * drives all three, which is exactly what a static story cannot show: the card
 * asks, and the owner is what withdraws `open`.
 */
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
 * The half jsdom cannot answer. Opening for real in Chromium is the standing
 * check on everything `showModal()` supplies and the shim in `vitest.setup.ts`
 * deliberately does not: the top layer, the inert page behind, and focus
 * restored to the trigger on the way out. The scroll lock and the initial focus
 * move are the two hand-added pieces riding along.
 *
 * It dismisses through a control inside the card rather than Escape. Escape is
 * the browser's close watcher, and a synthetic key event never reaches it — the
 * spec's Esc case runs against the shim, which models it explicitly.
 */
export const OpensFromATrigger: Story = {
	render: (args) => <TriggeredModal {...args} />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const trigger = canvas.getByRole('button', { name: TRIGGER_LABEL })
		await userEvent.click(trigger)

		const modal = await canvas.findByRole('dialog', { name: TITLE })
		await waitFor(() => expect(modal).toBeVisible())

		// Focus starts on the shell, so the name and description are read before
		// any control.
		await expect(modal).toHaveFocus()
		await expect(document.body).toHaveStyle({ overflow: 'hidden' })

		// In the top layer, with the page behind it inert. Asked for focus
		// directly, the trigger refuses it and the shell keeps it — that is the
		// browser's containment, not something this component polices.
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
 * The opt-in scrim close, and the premise it rests on: `::backdrop` is a
 * pseudo-element that takes no listener of its own, so a click on the scrim
 * reaches the `<dialog>` element itself. That attribution is a real-browser
 * fact, which is why this story checks it here rather than in the spec — the
 * shim in `vitest.setup.ts` has no backdrop and no hit testing at all.
 *
 * The drag half is the classic bug: a press that starts on the card and
 * releases outside it produces the very same click, and only where the press
 * began tells the two apart.
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

		// The top-left corner of the viewport is scrim in every story here: the
		// card is centred and 400px wide. Hit testing hands the click to the
		// dialog element, because that is what the backdrop belongs to.
		await expect(document.elementFromPoint(2, 2)).toBe(modal)

		// Selecting a line of copy and overshooting the card. Same click target
		// as the scrim, so only the press origin keeps the modal up.
		await userEvent.pointer([
			{ target: title, keys: '[MouseLeft>]' },
			{ target: modal, keys: '[/MouseLeft]' },
		])
		await expect(modal).toBeVisible()

		await userEvent.click(modal)
		await waitFor(() => expect(modal).not.toBeVisible())
		await expect(trigger).toHaveFocus()
	},
}
