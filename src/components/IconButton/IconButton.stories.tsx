import { cx } from '@css-utils'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import { IconButton } from './IconButton'
import styles from './IconButton.stories.module.css'
import { ICON_BUTTON_SIZES, ICON_BUTTON_TESTIDS, ICON_BUTTON_VARIANTS } from './constants'

const TOOLTIP_TESTID = `${ICON_BUTTON_TESTIDS.BASE}${ICON_BUTTON_TESTIDS.TOOLTIP_SUFFIX}`

/**
 * The states the Figma grid draws, as the forced pseudo-classes they are —
 * forced rather than simulated, because synthetic events never match a CSS
 * pseudo-class. Disabled is an attribute, which the addon cannot force.
 *
 * `focusVisible` is forced here so one story can show all four rings at once.
 * That is the cost of collapsing the grid: a real tab can only land on one
 * button. `TooltipOnFocus` keeps the honest check, moving actual DOM focus.
 */
const PSEUDO_BY_STATE = {
	default: {},
	hover: { hover: true },
	pressed: { active: true },
	focus: { focusVisible: true },
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
	decorators: [
		(Story) => (
			<div className={styles.canvas}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

/**
 * One column of the Figma Variant × State grid: every variant in a single
 * state. One row per variant, so onWood can carry the wood — it is the only
 * variant allowed on the frame, and the only one judged against it.
 */
const stateStory = (state: IconButtonState): Story => ({
	args: { disabled: state === 'disabled' },
	parameters: { pseudo: PSEUDO_BY_STATE[state] },
	render: (args) => (
		<div className={styles.grid}>
			{ICON_BUTTON_VARIANTS.map((variant) => (
				<div key={variant} className={cx(styles.row, variant === 'onWood' && styles.wood)}>
					<IconButton {...args} variant={variant} />
				</div>
			))}
		</div>
	),
})

export const Default: Story = stateStory('default')
export const Hovered: Story = stateStory('hover')
export const Pressed: Story = stateStory('pressed')
export const Focused: Story = stateStory('focus')
export const Disabled: Story = stateStory('disabled')

/**
 * Every size in every variant: sm 32 · md 40 · lg 48, all past the 24px floor.
 * The state stories fix size at md, so this is where a 1px border on a 32px box
 * gets looked at — the pairing most likely to go wrong and least likely to show
 * at md.
 */
export const Sizes: Story = {
	render: (args) => (
		<div className={styles.grid}>
			{ICON_BUTTON_VARIANTS.map((variant) => (
				<div key={variant} className={cx(styles.row, variant === 'onWood' && styles.wood)}>
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
 * The same chip on real keyboard focus — tabbing rather than forcing the
 * pseudo-class, so `:focus-visible` actually matches. Shows the chip beside the
 * ring, which is the evidence that it never covers it (SC 2.4.11).
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
