import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent } from 'storybook/test'

import { Switch } from './Switch'

const meta = {
	title: 'Components/Switch',
	component: Switch,
	args: {
		label: 'Show numbers',
	},
	decorators: [
		(Story) => (
			// The focus ring sits on a page-coloured spacer, so it only reads
			// correctly against the page surface.
			<div style={{ padding: 'var(--space-6)', background: 'var(--surface-page)' }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Off: Story = {}

export const On: Story = {
	args: { defaultChecked: true },
}

export const WithDescription: Story = {
	args: { description: 'Shows the solved picture beside the board' },
}

export const OnWithDescription: Story = {
	args: {
		defaultChecked: true,
		description: 'Shows the solved picture beside the board',
	},
}

export const Disabled: Story = {
	args: { disabled: true },
}

export const DisabledOn: Story = {
	args: { disabled: true, defaultChecked: true },
}

export const Focused: Story = {
	play: async () => {
		// Tabbing rather than .focus(), so :focus-visible actually matches.
		await userEvent.tab()
	},
}

// The pointer-transient states are forced through the pseudo-states addon:
// play-function events are synthetic and never match :hover/:active.

export const Hovered: Story = {
	parameters: { pseudo: { hover: true } },
}

export const HoveredOn: Story = {
	args: { defaultChecked: true },
	parameters: { pseudo: { hover: true } },
}

export const Pressed: Story = {
	parameters: { pseudo: { hover: true, active: true } },
}

export const PressedOn: Story = {
	args: { defaultChecked: true },
	parameters: { pseudo: { hover: true, active: true } },
}
