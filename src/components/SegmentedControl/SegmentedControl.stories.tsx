import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'

import { SegmentedControl } from './SegmentedControl'
import type { SegmentedControlProps } from './SegmentedControl'

// A tuple, so the Hovered story can index a segment without a null check.
const boardDimensions = [
	{ value: '3', label: '3 × 3' },
	{ value: '4', label: '4 × 4' },
	{ value: '5', label: '5 × 5' },
] as const satisfies SegmentedControlProps['options']

const boardDimensionsWithSix: SegmentedControlProps['options'] = [
	...boardDimensions,
	{ value: '6', label: '6 × 6' },
]

const meta = {
	title: 'Components/SegmentedControl',
	component: SegmentedControl,
	args: {
		label: 'Board size',
		options: boardDimensions,
		value: '3',
		onChange: fn(),
	},
	// Selection writes back through `useArgs`, so clicking a segment behaves the
	// way it will in the app *and* the Controls panel stays the source of truth —
	// local state would freeze at mount and make the `value` control inert.
	render: ({ onChange, ...args }) => {
		const [, updateArgs] = useArgs<SegmentedControlProps>()

		const handleChange = (next: string) => {
			updateArgs({ value: next })
			onChange(next)
		}

		return <SegmentedControl {...args} onChange={handleChange} />
	},
} satisfies Meta<typeof SegmentedControl>

export default meta
type Story = StoryObj<typeof meta>

export const ThreeOptions: Story = {}

export const FourOptions: Story = {
	args: { options: boardDimensionsWithSix },
}

// Press and focus target the selected segment, matching the Figma variants.
// Hover targets an unselected one — that is where the affordance lives, and the
// selected pill is designed not to react.
export const Hovered: Story = {
	parameters: { pseudo: { hover: [`input[value="${boardDimensions[1].value}"]`] } },
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

// Setup captions the control with GRID SIZE. The same string still names the
// group, so the visible and clipped stories differ in paint only.
export const LabelVisible: Story = {
	args: { label: 'Grid size', labelVisible: true },
}

export const LabelVisibleDisabled: Story = {
	args: { label: 'Grid size', labelVisible: true, disabled: true },
}
