import type { Meta, StoryObj } from '@storybook/react-vite'

import { Tile } from './Tile'

const meta = {
	title: 'Components/Tile',
	component: Tile,
	args: {
		tile: 0,
		movable: true,
		showLabel: true,
	},
	decorators: [
		(Story) => (
			<div style={{ width: '8rem' }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Tile>

export default meta
type Story = StoryObj<typeof meta>

export const Movable: Story = {}

export const NotMovable: Story = {
	args: { movable: false },
}

export const WithoutLabel: Story = {
	args: { showLabel: false },
}
