import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { Tooltip } from './Tooltip'
import styles from './Tooltip.stories.module.css'

/** Stands in for the IconButton this tooltip will label in real UI. */
const TriggerButton = () => (
	<button type="button" className={styles.trigger}>
		i
	</button>
)

type Canvas = ReturnType<typeof within>

/**
 * Waits out the entry fade, so the story settles on the open state a reviewer
 * and axe should see. Mid-transition the tooltip is still at opacity 0, which
 * is neither.
 */
const settleOpen = async (canvas: Canvas) => {
	const tooltip = await canvas.findByRole('tooltip')
	await waitFor(() => expect(tooltip).toBeVisible())
}

const openOnHover = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
	const canvas = within(canvasElement)
	const trigger = canvas.getByRole('button')
	await userEvent.hover(trigger)
	await settleOpen(canvas)
}

const meta = {
	title: 'Components/Tooltip',
	component: Tooltip,
	args: {
		content: 'Records',
		children: <TriggerButton />,
	},
	decorators: [
		(Story) => (
			<div className={styles.canvas}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

/** Resting state: the chip is out of the top layer and out of the a11y tree. */
export const Closed: Story = {}

export const Top: Story = {
	args: { placement: 'top' },
	play: openOnHover,
}

export const Right: Story = {
	args: { placement: 'right' },
	play: openOnHover,
}

export const Bottom: Story = {
	args: { placement: 'bottom' },
	play: openOnHover,
}

export const Left: Story = {
	args: { placement: 'left' },
	play: openOnHover,
}

/** Opened from the keyboard — the same state a focus-only user reaches. */
export const OpenedByFocus: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const trigger = canvas.getByRole('button')
		await userEvent.tab()
		await expect(trigger).toHaveFocus()
		await settleOpen(canvas)
	},
}
