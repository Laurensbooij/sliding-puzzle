import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { Button } from './Button'
import { BUTTON_SIZES, BUTTON_VARIANTS } from './constants'

const meta = {
	title: 'Components/Button',
	component: Button,
	args: {
		children: 'Shuffle',
		variant: 'primary',
		size: 'md',
		onClick: fn(),
	},
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

/** Every variant side by side — one row of the Figma variants × states grid. */
const everyVariant: Story['render'] = (args) => (
	<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
		{BUTTON_VARIANTS.map((variant) => (
			<Button key={variant} {...args} variant={variant} />
		))}
	</div>
)

export const Primary: Story = {}

export const Secondary: Story = {
	args: { variant: 'secondary' },
}

export const Ghost: Story = {
	args: { variant: 'ghost' },
}

export const Soft: Story = {
	args: { variant: 'soft' },
}

export const Danger: Story = {
	args: { variant: 'danger' },
}

/**
 * Pointer-transient states are forced by the addon rather than simulated: a
 * `userEvent` hover dispatches a synthetic event that no CSS `:hover` matches,
 * so a story built that way would quietly render the default state.
 */
export const Hovered: Story = {
	parameters: { pseudo: { hover: true } },
	render: everyVariant,
}

export const Pressed: Story = {
	parameters: { pseudo: { hover: true, active: true } },
	render: everyVariant,
}

/** Danger takes the rose ring; every other variant takes the teal one. */
export const Focused: Story = {
	parameters: { pseudo: { focusVisible: true } },
	render: everyVariant,
}

export const Disabled: Story = {
	args: { disabled: true },
	render: everyVariant,
}

/** sm 32 · md 40 · lg 48, with the label and glyph stepping up alongside. */
export const Sizes: Story = {
	render: (args) => (
		<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
			{BUTTON_SIZES.map((size) => (
				<Button key={size} {...args} size={size} iconStart="shuffle" />
			))}
		</div>
	),
}

export const WithLeadingIcon: Story = {
	args: { iconStart: 'shuffle' },
	render: everyVariant,
}

export const WithTrailingIcon: Story = {
	args: { iconEnd: 'chevron-down', variant: 'secondary' },
}

export const WithBothIcons: Story = {
	args: { iconStart: 'rotate-ccw', iconEnd: 'chevron-down', variant: 'soft' },
}

/** Stacked mobile actions — each button fills the column it sits in. */
export const FullWidth: Story = {
	args: { fullWidth: true },
	render: (args) => (
		<div style={{ display: 'grid', gap: '0.75rem', maxWidth: '20rem' }}>
			<Button {...args} variant="primary" />
			<Button {...args} variant="secondary">
				Cancel
			</Button>
		</div>
	),
}
