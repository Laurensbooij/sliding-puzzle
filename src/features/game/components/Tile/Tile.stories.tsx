import type { Meta, StoryObj } from '@storybook/react-vite'
import { userEvent, within } from 'storybook/test'

import { Tile } from './Tile'

const BOARD_COLS = 3
const BOARD_ROWS = 3

const meta = {
	title: 'Components/Tile',
	component: Tile,
	args: {
		tile: 0,
		sourceImage: 'sailboat',
		rows: BOARD_ROWS,
		cols: BOARD_COLS,
		movable: true,
		showLabel: true,
	},
	parameters: {
		// Columns of the wood panel the decorator lays the story's tiles out in.
		panelColumns: 1,
	},
	decorators: [
		// Tiles are glass: they only read correctly over the wood they sit on.
		(Story, { parameters }) => (
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: `repeat(${parameters.panelColumns}, 8rem)`,
					gap: 'var(--tile-gap)',
					width: 'fit-content',
					padding: 'var(--frame-padding)',
					borderRadius: 'var(--radius-frame)',
					backgroundImage: 'var(--material-wood)',
				}}
			>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Tile>

export default meta
type Story = StoryObj<typeof meta>

/** Figma `State=selectable`: the bead sits at 40%, which is how you know it can move. */
export const Movable: Story = {}

/**
 * Figma `State=not movable`, and `State=rest` with it — the two are drawn
 * identically, because a tile that cannot move shows no bead at all and that
 * silence is the whole affordance.
 */
export const NotMovable: Story = {
	args: { movable: false },
}

/** Figma `State=hover selectable`: the glass brightens and the bead swells, no hue is added. */
export const Hovered: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const tileButton = canvas.getByRole('button')
		await userEvent.hover(tileButton)
	},
}

/** Figma `State=pressed`: warm inner shadow, scale .985, no translation, no shadow growth. */
export const Pressed: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const tileButton = canvas.getByRole('button')
		await userEvent.pointer({ keys: '[MouseLeft>]', target: tileButton })
	},
}

/** Figma `State=focus`: the on-wood ring draws outside the tile, so nothing obscures it. */
export const Focused: Story = {
	// Focused directly rather than by Tab: the preview iframe puts Storybook's
	// own controls ahead of the story in the tab order.
	play: ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const tileButton = canvas.getByRole('button')
		tileButton.focus()
	},
}

export const WithoutLabel: Story = {
	args: { showLabel: false },
}

/**
 * Every tile of a solved board, each showing its own fragment of one shared
 * source image — the check that the home-cell offsets line up.
 */
export const SolvedBoard: Story = {
	parameters: { panelColumns: BOARD_COLS },
	render: (args) => (
		<>
			{Array.from({ length: BOARD_ROWS * BOARD_COLS }, (_, tile) => (
				<Tile key={tile} {...args} tile={tile} showLabel={false} />
			))}
		</>
	),
}
