import { GAP, createBoard, movableTiles } from '@engine'
import type { Meta, StoryObj } from '@storybook/react-vite'

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
	parameters: { pseudo: { hover: true } },
}

/** Figma `State=pressed`: warm inner shadow, scale .985, no translation, no shadow growth. */
export const Pressed: Story = {
	parameters: { pseudo: { active: true } },
}

/** Figma `State=focus`: the on-wood ring draws outside the tile, so nothing obscures it. */
export const Focused: Story = {
	parameters: { pseudo: { focusVisible: true } },
}

export const WithoutLabel: Story = {
	args: { showLabel: false },
}

/**
 * A solved board with its gap in the bottom-right cell: each tile shows its own
 * fragment of one shared source image, and only the tiles sharing the gap's row
 * or column carry a bead, because only those can move.
 */
export const SolvedBoard: Story = {
	parameters: { panelColumns: BOARD_COLS },
	render: (args) => {
		const board = createBoard(BOARD_ROWS, BOARD_COLS)
		const movable = new Set(movableTiles(board))

		return (
			<>
				{board.cells.map((tile, cell) =>
					tile === GAP ? (
						<div key={cell} />
					) : (
						<Tile
							key={cell}
							{...args}
							tile={tile}
							movable={movable.has(tile)}
							showLabel={false}
						/>
					),
				)}
			</>
		)
	},
}
