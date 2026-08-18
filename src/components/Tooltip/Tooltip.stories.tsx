import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { Tooltip } from './Tooltip'

/**
 * Stands in for the IconButton this tooltip will label in real UI — including
 * its focus ring, so the stories show that an open tooltip never covers it
 * (SC 2.4.11).
 */
const triggerStyles = `
	.sb-tooltip-trigger {
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		background: var(--surface-card);
		color: var(--text-body);
		font: var(--label);
		cursor: pointer;
	}
	.sb-tooltip-trigger:focus-visible {
		outline: 2px solid var(--focus-ring);
		outline-offset: 2px;
	}
`

const TriggerButton = () => (
	<button type="button" className="sb-tooltip-trigger">
		i
	</button>
)

/**
 * Opens the tooltip so the story renders — and axe scans — its settled open
 * state. The wait is the entry fade: mid-transition the tooltip is still at
 * opacity 0, which is neither what a reviewer should see nor what axe should
 * measure contrast against.
 */
const settleOpen = async (canvasElement: HTMLElement) => {
	const canvas = within(canvasElement)
	const tooltip = await canvas.findByRole('tooltip')
	await waitFor(() => expect(tooltip).toBeVisible())
}

const openOnHover = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
	const canvas = within(canvasElement)
	const trigger = canvas.getByRole('button')
	await userEvent.hover(trigger)
	await settleOpen(canvasElement)
}

const meta = {
	title: 'Components/Tooltip',
	component: Tooltip,
	args: {
		content: 'Fewer moves is better',
		children: <TriggerButton />,
	},
	decorators: [
		(Story) => (
			<div
				style={{
					display: 'grid',
					placeItems: 'center',
					minHeight: '12rem',
					background: 'var(--surface-page)',
				}}
			>
				<style>{triggerStyles}</style>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

/** Resting state: the tooltip is out of the top layer and out of the a11y tree. */
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

/** Content past the max width wraps rather than stretching across the viewport. */
export const LongContent: Story = {
	args: {
		content: 'Arrow keys pick the tile next to the gap, and Enter slides it into place.',
	},
	play: openOnHover,
}

/** Opened from the keyboard — the same state a focus-only user reaches. */
export const OpenedByFocus: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const trigger = canvas.getByRole('button')
		await userEvent.tab()
		await expect(trigger).toHaveFocus()
		await settleOpen(canvasElement)
	},
}
