import type { Board as BoardModel, CellIndex, TileId } from '@engine'
import { GAP, applyMove, createBoard, movesForCell, shuffle } from '@engine'
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
	title: 'Widgets/Board',
	component: Board,
	args: {
		board: midGame,
		sourceImage: 'sailboat',
	},
	parameters: {
		layout: 'centered',
	},
	decorators: [
		// The frame casts a wide drop shadow; the room keeps it off the edges.
		// Sized against the viewport, not the parent: Storybook's centered layout
		// shrink-wraps its root to this element, so a percentage here resolves
		// against a width this element is itself deciding. The 2rem is that root's
		// own padding, which the viewport has to cover too.
		(Story) => (
			<div
				style={{
					boxSizing: 'border-box',
					width: 'min(38rem, calc(100vw - 2rem))',
					padding: 'var(--space-6)',
				}}
			>
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

/**
 * Figma `Footer=true, Preview=true`: the solved picture, the standing hint and
 * both game controls — abandon, then restart — inside the wood below the well.
 * They are the shared IconButton on its `onWood` variant, the only one the
 * design allows on the frame.
 */
export const WithFooter: Story = {
	args: { footer: true },
}

/**
 * Figma `Preview=false`. Both states are real: the preview is a player setting,
 * and the footer collapses to a single control-height row without it.
 */
export const FooterWithoutPreview: Story = {
	args: { footer: true, preview: false },
}

/**
 * `Numbered=true`: the assist label on every tile. Paint only — a tile is named
 * "Tile 3" by its `aria-label` on either setting, so the board reads the same to
 * a screen reader. Play turns this on from the Numbered tiles setting.
 */
export const Numbered: Story = {
	args: { numbered: true },
}

/**
 * A screen-supplied footer line. The Board never works this out for itself: an
 * unshuffled board is solved too, so only the screen owning the lifecycle can
 * tell a win from a deal that has not happened yet.
 */
export const WithCustomHint: Story = {
	args: { footer: true, hint: 'Solved' },
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
 * `interactive={false}`: the board as decoration. It paints exactly as the
 * played board does — no tile is a tab stop, no press or arrow is answered, and
 * no live region mounts — and the screen around it says what it is for. This is
 * how Setup shows the picture the player is about to scramble.
 */
export const Inert: Story = {
	args: {
		board: createBoard(BOARD_ROWS, BOARD_COLS),
		interactive: false,
		label: 'The solved picture at 3×3',
	},
}

/**
 * Playable — the only story that owns a board, and so the only one that
 * announces: Board reports the board it is given, not the press it sent out, so
 * a story with no state has nothing to report. Real lifecycle lives in the game
 * machine (ADR-0003); this stand-in is not a pattern to copy.
 *
 * Abandon stays inert here on purpose: leaving a game is a screen's decision, so
 * a story has nothing to hand it.
 */
export const Playable: Story = {
	args: { footer: true },
	render: (args) => {
		const PlayableBoard = () => {
			const [board, setBoard] = useState(midGame)
			const press = (cell: CellIndex) =>
				setBoard((current) => movesForCell(current, cell).reduce(applyMove, current))

			return (
				<Board
					{...args}
					board={board}
					onCellPress={press}
					// The story is the edge here, so it supplies the randomness the
					// engine refuses to reach for itself (ADR-0001).
					onRestart={() =>
						setBoard(shuffle(createBoard(BOARD_ROWS, BOARD_COLS), Math.random))
					}
				/>
			)
		}

		return <PlayableBoard />
	},
}
