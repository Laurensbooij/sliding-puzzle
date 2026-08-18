import { cx } from '@css-utils'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { IconButton } from './IconButton'
import type { IconButtonVariant } from './IconButton'
import styles from './IconButton.stories.module.css'
import { ICON_BUTTON_SIZES, ICON_BUTTON_TESTIDS } from './constants'

const TOOLTIP_TESTID = `${ICON_BUTTON_TESTIDS.BASE}${ICON_BUTTON_TESTIDS.TOOLTIP_SUFFIX}`

/** The states the Figma grid draws, as the forced pseudo-classes they are. */
const PSEUDO_BY_STATE = {
	default: {},
	hover: { hover: true },
	pressed: { active: true },
	focus: { focusVisible: true },
	// Disabled is an attribute, not a pseudo-class the addon can force.
	disabled: {},
} as const

type IconButtonState = keyof typeof PSEUDO_BY_STATE

const meta = {
	title: 'Components/IconButton',
	component: IconButton,
	args: {
		icon: 'shuffle',
		label: 'Shuffle the board',
		variant: 'solid',
		size: 'md',
	},
	// onWood is the only variant allowed on the frame, so it is the only one
	// shown against it — the wood follows the variant rather than each story
	// restating its own backdrop.
	decorators: [
		(Story, context) => (
			<div className={cx(styles.canvas, context.args.variant === 'onWood' && styles.wood)}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

/** One cell of the Figma Variant × State grid. */
const gridStory = (variant: IconButtonVariant, state: IconButtonState): Story => ({
	args: { variant, disabled: state === 'disabled' },
	parameters: { pseudo: PSEUDO_BY_STATE[state] },
})

export const Solid: Story = gridStory('solid', 'default')
export const SolidHovered: Story = gridStory('solid', 'hover')
export const SolidPressed: Story = gridStory('solid', 'pressed')
export const SolidFocused: Story = gridStory('solid', 'focus')
export const SolidDisabled: Story = gridStory('solid', 'disabled')

export const Outline: Story = gridStory('outline', 'default')
export const OutlineHovered: Story = gridStory('outline', 'hover')
export const OutlinePressed: Story = gridStory('outline', 'pressed')
export const OutlineFocused: Story = gridStory('outline', 'focus')
export const OutlineDisabled: Story = gridStory('outline', 'disabled')

export const Ghost: Story = gridStory('ghost', 'default')
export const GhostHovered: Story = gridStory('ghost', 'hover')
export const GhostPressed: Story = gridStory('ghost', 'pressed')
export const GhostFocused: Story = gridStory('ghost', 'focus')
export const GhostDisabled: Story = gridStory('ghost', 'disabled')

export const OnWood: Story = gridStory('onWood', 'default')
export const OnWoodHovered: Story = gridStory('onWood', 'hover')
export const OnWoodPressed: Story = gridStory('onWood', 'pressed')
export const OnWoodFocused: Story = gridStory('onWood', 'focus')
export const OnWoodDisabled: Story = gridStory('onWood', 'disabled')

/** The three control heights: sm 32 · md 40 · lg 48, all past the 24px floor. */
export const Sizes: Story = {
	render: (args) => (
		<>
			{ICON_BUTTON_SIZES.map((size) => (
				<IconButton key={size} {...args} size={size} />
			))}
		</>
	),
}

/** Every glyph carries its own name, so a row of them stays distinguishable. */
export const Row: Story = {
	render: (args) => (
		<>
			<IconButton {...args} icon="shuffle" label="Shuffle the board" />
			<IconButton {...args} icon="rotate-ccw" label="Restart the game" variant="outline" />
			<IconButton {...args} icon="pause" label="Pause the game" variant="ghost" />
			<IconButton {...args} icon="settings" label="Open settings" variant="ghost" />
		</>
	),
}

/**
 * The label as the sighted user gets it. Real hover, not a forced pseudo-class:
 * the chip opens on a pointer event, which `pseudo` cannot fire.
 */
export const TooltipOnHover: Story = {
	decorators: [
		(Story) => (
			<div className={cx(styles.canvas, styles.withTooltipRoom)}>
				<Story />
			</div>
		),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const button = canvas.getByRole('button')
		await userEvent.hover(button)

		const chip = await canvas.findByTestId(TOOLTIP_TESTID)
		await waitFor(() => expect(chip).toBeVisible())
	},
}

/**
 * The same chip on keyboard focus, alongside the focus ring — the pair a
 * keyboard user sees, and evidence the chip never covers the ring (SC 2.4.11).
 */
export const TooltipOnFocus: Story = {
	decorators: [
		(Story) => (
			<div className={cx(styles.canvas, styles.withTooltipRoom)}>
				<Story />
			</div>
		),
	],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const button = canvas.getByRole('button')
		await userEvent.tab()

		const chip = await canvas.findByTestId(TOOLTIP_TESTID)
		await expect(button).toHaveFocus()
		await waitFor(() => expect(chip).toBeVisible())
	},
}
