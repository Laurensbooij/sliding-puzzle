import { cx } from '@css-utils'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { IconButton } from './IconButton'
import type { IconButtonVariant } from './IconButton'
import styles from './IconButton.stories.module.css'
import { ICON_BUTTON_SIZES, ICON_BUTTON_TESTIDS, ICON_BUTTON_VARIANTS } from './constants'

const TOOLTIP_TESTID = `${ICON_BUTTON_TESTIDS.BASE}${ICON_BUTTON_TESTIDS.TOOLTIP_SUFFIX}`

/**
 * The pointer-transient states the Figma grid draws, forced rather than
 * simulated — synthetic events never match a CSS pseudo-class. Focus is absent
 * on purpose: it is real DOM focus below, so `:focus-visible` actually matches.
 * Disabled is an attribute, not a pseudo-class the addon can force.
 */
const PSEUDO_BY_STATE = {
	default: {},
	hover: { hover: true },
	pressed: { active: true },
	focus: {},
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
	// Tabbing rather than .focus(), so :focus-visible actually matches.
	play: state === 'focus' ? async () => await userEvent.tab() : undefined,
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

/**
 * Every size in every variant: sm 32 · md 40 · lg 48, all past the 24px floor.
 * The grid above fixes size at md, so this is where a 1px border on a 32px box
 * gets looked at — the pairing most likely to go wrong and least likely to show
 * at md.
 */
export const Sizes: Story = {
	render: ({ size: _size, variant: _variant, ...args }) => (
		<div className={styles.sizeGrid}>
			{ICON_BUTTON_VARIANTS.map((variant) => (
				<div
					key={variant}
					className={cx(styles.sizeRow, variant === 'onWood' && styles.wood)}
				>
					{ICON_BUTTON_SIZES.map((size) => (
						<IconButton key={size} {...args} variant={variant} size={size} />
					))}
				</div>
			))}
		</div>
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

/** The chip opens into the top layer, so the canvas has to leave it room. */
const withTooltipRoom: NonNullable<Story['decorators']> = [
	(Story) => (
		<div className={cx(styles.canvas, styles.withTooltipRoom)}>
			<Story />
		</div>
	),
]

/** Waits out the entry fade, so the story settles on the state axe should see. */
const settleOpen = async (canvas: ReturnType<typeof within>) => {
	const chip = await canvas.findByTestId(TOOLTIP_TESTID)
	await waitFor(() => expect(chip).toBeVisible())
}

/**
 * The label as the sighted user gets it. Real hover, not a forced pseudo-class:
 * the chip opens on a pointer event, which `pseudo` cannot fire.
 */
export const TooltipOnHover: Story = {
	decorators: withTooltipRoom,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const button = canvas.getByRole('button')
		await userEvent.hover(button)

		await settleOpen(canvas)
	},
}

/**
 * The same chip on keyboard focus, alongside the focus ring — the pair a
 * keyboard user sees, and evidence the chip never covers the ring (SC 2.4.11).
 */
export const TooltipOnFocus: Story = {
	decorators: withTooltipRoom,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const button = canvas.getByRole('button')
		await userEvent.tab()

		await expect(button).toHaveFocus()
		await settleOpen(canvas)
	},
}

/**
 * The label has to reach a user who cannot press the control — "why is this
 * off?" is exactly when the name is worth reading. A disabled button is not
 * focusable, so hover is the only way in, and browsers suppress its own pointer
 * events: this story is the standing check that the chip still opens, because
 * jsdom cannot answer it (the popover shim has no hit testing).
 */
export const TooltipWhileDisabled: Story = {
	args: { disabled: true },
	decorators: withTooltipRoom,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const button = canvas.getByRole('button')
		await userEvent.hover(button)

		await settleOpen(canvas)
	},
}
