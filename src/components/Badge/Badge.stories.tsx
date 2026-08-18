import type { Meta, StoryObj } from '@storybook/react-vite'
import { Check } from 'lucide-react'

import { Badge } from './Badge'
import type { BadgeTone } from './Badge'

const tones: BadgeTone[] = ['neutral', 'accent', 'amber', 'danger', 'inverse']

const meta = {
	title: 'Components/Badge',
	component: Badge,
	args: {
		children: 'Solved',
		tone: 'neutral',
	},
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Neutral: Story = {}

export const Accent: Story = {
	args: { tone: 'accent' },
}

export const Amber: Story = {
	args: { tone: 'amber' },
}

export const Danger: Story = {
	args: { tone: 'danger' },
}

export const Inverse: Story = {
	args: { tone: 'inverse' },
}

/** Every tone with its leading glyph — the second column of the Figma matrix. */
export const WithIcon: Story = {
	render: (args) => (
		<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
			{tones.map((tone) => (
				<Badge key={tone} {...args} tone={tone} icon={<Check />} />
			))}
		</div>
	),
}
