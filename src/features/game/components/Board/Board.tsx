import type { SourceImageName } from '@/source-images'
import type { Board as BoardModel, CellIndex } from '@engine'
import {
	GAP,
	cellForDirection,
	directionOfMove,
	movableTiles,
	movesForCell,
	toPlacements,
} from '@engine'
import { useTranslate } from '@i18n'
import type { FC } from 'react'
import { useState } from 'react'

import { Tile } from '../Tile'
import styles from './Board.module.css'
import { BOARD_TESTIDS, DIRECTION_BY_KEY } from './constants'
import { boardMessages } from './translation-messages'
import type { CellStyle, WellStyle } from './types'

export interface BoardProps {
	/** The arrangement to render. Board reads it; the game machine owns it. */
	board: BoardModel
	/** The artwork every tile carries one fragment of. */
	sourceImage: SourceImageName
	/**
	 * Shows the numbered assist labels on every tile. Off by default: the board
	 * Figma draws carries none, and a tile's accessible name is its `aria-label`
	 * either way, so the labels are a visual assist rather than the affordance.
	 */
	showLabels?: boolean
	/**
	 * Called with the pressed cell — never with a move. Which tiles that press
	 * relocates is the engine's business, and the machine's to apply.
	 */
	onCellPress?: (cell: CellIndex) => void
	/** Overrides the BASE testid. */
	dataTestId?: string
}

/**
 * The board and its frame: a wooden surround, a sunken well, and one glass Tile
 * per occupied cell. Presentational — it sends a pressed cell outward and reads
 * everything else off the board it is given.
 *
 * Keyboard operation map, asserted in full in the spec:
 *
 * - **Tab** — moves through the movable tiles only. Every tile sharing the
 *   gap's row or column is a tab stop, which is how a multi-cell run is played
 *   without a modifier chord: tab to the far tile and press it.
 * - **Space / Enter** — presses the focused tile (the Tile's own behaviour).
 * - **Arrows** — press the tile that would travel that way into the gap
 *   (ADR-0014), from anywhere inside the board. An accelerator for the single
 *   adjacent move; runs go through Tab.
 *
 * Arrows are handled here rather than on a Tile because the tile they name is
 * fixed by the gap, not by whatever currently holds focus. Nothing outside the
 * board is affected: the listener sits on the container, so the keys are live
 * only while focus is inside it.
 *
 * Tiles render in tile order rather than cell order, so a move animates the same
 * element from its old cell to its new one instead of remounting it elsewhere.
 */
export const Board: FC<BoardProps> = ({
	board,
	sourceImage,
	showLabels = false,
	onCellPress,
	dataTestId,
}) => {
	const [announcement, setAnnouncement] = useState('')
	const { translate } = useTranslate()
	const base = dataTestId ?? BOARD_TESTIDS.BASE
	const movable = movableTiles(board)
	const placements = toPlacements(board)

	const wellStyle: WellStyle = {
		'--board-rows': board.rows,
		'--board-cols': board.cols,
	}

	const cellStyle = (cell: CellIndex): CellStyle => ({
		'--cell-row': Math.floor(cell / board.cols),
		'--cell-col': cell % board.cols,
	})

	const pressCell = (cell: CellIndex) => {
		const moves = movesForCell(board, cell)
		const [first] = moves
		if (!first) return

		// Phrased from the moves rather than from the key, so a pointer press and
		// an arrow press read identically. Every move in a run shares a direction,
		// so the first one speaks for all of them.
		setAnnouncement(
			translate(boardMessages.moveAnnouncement, {
				count: moves.length,
				direction: directionOfMove(board, first),
			}),
		)
		onCellPress?.(cell)
	}

	return (
		// The handler serves the tiles that bubble into it, not this element:
		// every key it acts on arrives from a focused <button>, and the board
		// itself is neither focusable nor a tab stop. Nothing is faked
		// interactive, which is what the rule guards against.
		// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- key delegation from focusable descendants
		<div
			className={styles.board}
			data-testid={base}
			role="group"
			aria-label={translate(boardMessages.label, { rows: board.rows, cols: board.cols })}
			onKeyDown={(event) => {
				const direction = DIRECTION_BY_KEY[event.key]
				if (!direction) return

				// Claimed whether or not a tile answers, so a blocked direction never
				// falls through to scrolling the page instead.
				event.preventDefault()
				const cell = cellForDirection(board, direction)
				if (cell !== null) pressCell(cell)
			}}
		>
			<span className={styles.bevel} />
			<div
				className={styles.well}
				data-testid={`${base}${BOARD_TESTIDS.WELL_SUFFIX}`}
				style={wellStyle}
			>
				<div className={styles.cells}>
					{placements.map(({ tile, cell }) => (
						<div key={tile} className={styles.cell} style={cellStyle(cell)}>
							<Tile
								tile={tile}
								sourceImage={sourceImage}
								rows={board.rows}
								cols={board.cols}
								movable={movable.includes(tile)}
								showLabel={showLabels}
								onPress={() => pressCell(cell)}
								dataTestId={`${base}${BOARD_TESTIDS.TILE_SUFFIX}`}
							/>
						</div>
					))}
					<div
						className={styles.gap}
						data-testid={`${base}${BOARD_TESTIDS.GAP_SUFFIX}`}
						style={cellStyle(board.cells.indexOf(GAP))}
						aria-hidden
					/>
				</div>
			</div>
			{/* `role="status"` already implies polite and atomic; both are spelled
			    out because older screen readers honour the attributes and not the
			    role, and the role is what gives tests an accessible query. */}
			<div
				className={styles.announcer}
				data-testid={`${base}${BOARD_TESTIDS.ANNOUNCER_SUFFIX}`}
				role="status"
				aria-live="polite"
				aria-atomic="true"
			>
				{announcement}
			</div>
		</div>
	)
}
