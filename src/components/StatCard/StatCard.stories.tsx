import { Icon } from '@components/Icon'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { StatCard } from './StatCard'

const meta = {
	title: 'Components/StatCard',
	component: StatCard,
	args: {
		label: 'Moves',
		value: '042',
		icon: <Icon name="footprints" size="xs" />,
		tone: 'neutral',
	},
} satisfies Meta<typeof StatCard>

export default meta
type Story = StoryObj<typeof meta>

export const Neutral: Story = {}

export const Accent: Story = {
	args: { tone: 'accent' },
}

/** The only tone allowed on the frame, shown against the wood material it sits on. */
export const OnWood: Story = {
	args: { tone: 'onWood' },
	decorators: [
		(Story) => (
			<div
				style={{
					padding: '1.5rem',
					borderRadius: 'var(--radius-frame)',
					background: 'var(--material-wood)',
					width: 'fit-content',
				}}
			>
				<Story />
			</div>
		),
	],
}

export const WithoutIcon: Story = {
	args: { icon: undefined },
}
