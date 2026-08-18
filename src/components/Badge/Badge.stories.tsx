import type { Meta, StoryObj } from '@storybook/react-vite'

import { Badge } from './Badge'
import type { BadgeTone } from './Badge'

const tones: BadgeTone[] = ['neutral', 'accent', 'amber', 'danger', 'inverse']

/**
 * Stand-in for the design system's Icon component (a separate ticket): a Lucide
 * `check` glyph at the imported 24×24 / stroke-2 geometry, sized by Badge's slot.
 */
const CheckGlyph = () => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M20 6 9 17l-5-5" />
	</svg>
)

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
				<Badge key={tone} {...args} tone={tone} icon={<CheckGlyph />} />
			))}
		</div>
	),
}
