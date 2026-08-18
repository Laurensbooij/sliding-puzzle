import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn } from 'storybook/test'

import { SegmentedControl } from './SegmentedControl'
import type { SegmentedControlProps } from './SegmentedControl'

const gridSizes: SegmentedControlProps['options'] = [
	{ value: '3', label: '3 × 3' },
	{ value: '4', label: '4 × 4' },
	{ value: '5', label: '5 × 5' },
]

const gridSizesWithSix: SegmentedControlProps['options'] = [
	...gridSizes,
	{ value: '6', label: '6 × 6' },
]

const meta = {
	title: 'Components/SegmentedControl',
	component: SegmentedControl,
	args: {
		label: 'Grid size',
		options: gridSizes,
		value: '3',
		onChange: fn(),
	},
	// Stories drive selection for real, so clicking a segment in the canvas
	// behaves the way it will in the app.
	render: ({ value, onChange, ...args }) => {
		const Stateful = () => {
			const [selected, setSelected] = useState(value)

			return (
				<SegmentedControl
					{...args}
					value={selected}
					onChange={(next) => {
						setSelected(next)
						onChange(next)
					}}
				/>
			)
		}

		return <Stateful />
	},
} satisfies Meta<typeof SegmentedControl>

export default meta
type Story = StoryObj<typeof meta>

export const ThreeOptions: Story = {}

export const FourOptions: Story = {
	args: { options: gridSizesWithSix },
}

// Press and focus target the selected segment, matching the Figma variants.
// Hover targets an unselected one — that is where the affordance lives, and the
// selected pill is designed not to react.
export const Hovered: Story = {
	parameters: { pseudo: { hover: ['input[value="4"]'] } },
}

export const Pressed: Story = {
	parameters: { pseudo: { active: ['input:checked'] } },
}

export const Focused: Story = {
	parameters: { pseudo: { focusVisible: ['input:checked'] } },
}

export const Disabled: Story = {
	args: { disabled: true },
}
