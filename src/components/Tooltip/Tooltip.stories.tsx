import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { Tooltip } from './Tooltip'
import styles from './Tooltip.stories.module.css'
import { TOOLTIP_TESTIDS } from './constants'

/**
 * Stands in for the IconButton this tooltip will label in real UI: icon-only,
 * carrying the same name the chip shows. The chip is then the sighted half of
 * a name AT already has, and stays out of the accessibility tree.
 */
const IconTrigger = () => (
	<button type="button" className={styles.trigger} aria-label="Records">
		i
	</button>
)

/** A trigger already named by its own text, so the chip describes it instead. */
const TextTrigger = () => (
	<button type="button" className={`${styles.trigger} ${styles.textTrigger}`}>
		Stats
	</button>
)

type Canvas = ReturnType<typeof within>

/**
 * Waits out the entry fade, so the story settles on the open state a reviewer
 * and axe should see. Mid-transition the chip is still at opacity 0, which is
 * neither. Found by testid rather than role, because the chip has no role at
 * all when it is hidden from assistive tech.
 */
const settleOpen = async (canvas: Canvas) => {
	const chip = await canvas.findByTestId(TOOLTIP_TESTIDS.BASE)
	await waitFor(() => expect(chip).toBeVisible())
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
		children: <IconTrigger />,
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

/**
 * The secondary wiring: a trigger with a name of its own gets the chip as an
 * `aria-describedby` description rather than a hidden duplicate.
 */
export const Describing: Story = {
	args: { content: 'Your best solve', children: <TextTrigger /> },
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
