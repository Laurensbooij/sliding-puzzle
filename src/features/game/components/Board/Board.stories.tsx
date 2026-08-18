import type { Board as BoardModel, CellIndex, TileId } from '@engine'
import { GAP, applyMove, createBoard, movesForCell } from '@engine'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Board } from './Board'

const BOARD_ROWS = 3
const BOARD_COLS = 3

const boardOf = (
	rows: number,
	cols: number,
	cells: readonly (TileId | typeof GAP)[],
): BoardModel => ({ rows, cols, cells })

/** The arrangement Figma draws: mid-game, gap in the bottom-right cell. */
const midGame = boardOf(BOARD_ROWS, BOARD_COLS, [0, 4, 1, 3, 6, 2, 5, 7, GAP])

const meta = {
	title: 'Game/Board',
	component: Board,
	args: {
		board: midGame,
		sourceImage: 'sailboat',
		showLabels: false,
	},
	parameters: {
		layout: 'centered',
	},
	decorators: [
		// The frame casts a wide drop shadow; the room keeps it off the edges.
		(Story) => (
			<div style={{ width: '38rem', maxWidth: '100%', padding: 'var(--space-6)' }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Board>

export default meta
type Story = StoryObj<typeof meta>

/** Figma `Footer=false`: wood, sunken well, eight glass tiles and one gap. */
export const MidGame: Story = {}

/**
 * Every tile on its home cell. The source image reads as one picture across the
 * board, which is the whole point of solving it.
 */
export const Solved: Story = {
	args: { board: createBoard(BOARD_ROWS, BOARD_COLS) },
}

/** The numbered assist turned on, for players who want position cues. */
export const WithLabels: Story = {
	args: { showLabels: true },
}

/** A different source image on the same arrangement. */
export const AlternateSourceImage: Story = {
	args: { sourceImage: 'bike' },
}

/**
 * The gap in the centre, so all four arrow keys have a tile to name. Tab in and
 * press one: `ArrowRight` slides the tile on the gap's *left* rightward
 * (ADR-0014).
 */
export const GapInCentre: Story = {
	args: { board: boardOf(BOARD_ROWS, BOARD_COLS, [0, 1, 2, 3, GAP, 4, 5, 6, 7]) },
}

/**
 * Non-square, and wide enough for a run of three: pressing the far tile in the
 * gap's row slides every tile between them.
 */
export const NonSquare: Story = {
	args: { board: boardOf(2, 4, [GAP, 0, 1, 2, 3, 4, 5, 6]) },
}

/**
 * Playable — the only story that owns a board, so the slide and the live region
 * can be exercised by hand. Real lifecycle lives in the game machine (ADR-0003);
 * this is a story-local stand-in, not a pattern to copy.
 */
export const Playable: Story = {
	render: (args) => {
		const PlayableBoard = () => {
			const [board, setBoard] = useState(midGame)
			const press = (cell: CellIndex) =>
				setBoard((current) => movesForCell(current, cell).reduce(applyMove, current))

			return <Board {...args} board={board} onCellPress={press} />
		}

		return <PlayableBoard />
	},
}
