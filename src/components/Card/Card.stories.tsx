import type { Meta, StoryObj } from '@storybook/react-vite'

import { Card } from './Card'
import type { CardPadding } from './Card'

const paddings: CardPadding[] = ['none', 'sm', 'md', 'lg']

const SampleContent = () => (
	<>
		<h3 style={{ font: 'var(--heading)', color: 'var(--text-strong)' }}>Records</h3>
		<p style={{ font: 'var(--body-sm)', color: 'var(--text-muted)' }}>
			Solve a puzzle and it lands here.
		</p>
	</>
)

const meta = {
	title: 'Components/Card',
	component: Card,
	args: {
		padding: 'sm',
		raised: false,
		children: <SampleContent />,
	},
	decorators: [
		(Story) => (
			<div style={{ width: '20rem' }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Small: Story = {}

export const Medium: Story = {
	args: { padding: 'md' },
}

export const Large: Story = {
	args: { padding: 'lg' },
}

export const NoPadding: Story = {
	args: { padding: 'none' },
}

/** Every padding step on shadow/2 — the second column of the Figma matrix. */
export const Raised: Story = {
	decorators: [
		(Story) => (
			<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '20rem' }}>
				<Story />
			</div>
		),
	],
	render: (args) => (
		<>
			{paddings.map((padding) => (
				<Card key={padding} {...args} padding={padding} raised />
			))}
		</>
	),
}
