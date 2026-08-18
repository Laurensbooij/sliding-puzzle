import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent } from 'storybook/test'

import { Select } from './Select'
import type { SelectProps } from './Select'

const artPacks: SelectProps['options'] = [
	{ value: 'sailboat', label: 'Sailboat' },
	{ value: 'lighthouse', label: 'Lighthouse' },
	{ value: 'orchard', label: 'Orchard' },
	{ value: 'cityscape', label: 'Cityscape' },
]

const meta = {
	title: 'Components/Select',
	component: Select,
	args: {
		label: 'Art pack',
		options: artPacks,
	},
	decorators: [
		(Story) => (
			// The page surface matters: the focus ring sits on a page-coloured
			// spacer and only reads correctly against it.
			<div style={{ padding: 'var(--space-6)', background: 'var(--surface-page)' }}>
				{/* 260px is the width Figma draws the component set at. The control
				    itself is fluid, so the width belongs to the box around it. */}
				<div style={{ width: '16.25rem' }}>
					<Story />
				</div>
			</div>
		),
	],
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// Hover is forced through the pseudo-states addon: play-function events are
// synthetic and never match :hover.
export const Hovered: Story = {
	parameters: { pseudo: { hover: true } },
}

export const Focused: Story = {
	play: async () => {
		// Tabbing rather than .focus(), so :focus-visible actually matches.
		await userEvent.tab()
	},
}

export const Disabled: Story = {
	args: { disabled: true },
}
