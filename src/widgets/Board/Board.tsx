import { IconButton } from '@components/IconButton'
import type { Board as BoardModel, CellIndex } from '@engine'
import {
	cellForDirection,
	directionOfMove,
	gapCell,
	movableTiles,
	movesBetween,
	movesForCell,
	toPlacements,
} from '@engine'
import { Message, useTranslate } from '@i18n'
import { SOURCE_IMAGES } from '@source-images'
import type { SourceImageName } from '@source-images'
import type { FC, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

import styles from './Board.module.css'
import { Tile } from './Tile'
import { BOARD_TESTIDS, DIRECTION_BY_KEY } from './constants'
import { boardMessages } from './translation-messages'
import type { Announcement, CellStyle, WellStyle } from './types'

export interface BoardProps {
	/** The arrangement to render. Board reads it; the game machine owns it. */
	board: BoardModel
	/** The artwork every tile carries one fragment of. */
	sourceImage: SourceImageName
	/**
	 * Called with the pressed cell — never with a move. Which tiles that press
	 * relocates is the engine's business, and the machine's to apply.
	 */
	onCellPress?: (cell: CellIndex) => void
	/**
	 * Whether this board is played. Off, it is decoration: no tile is a tab stop,
	 * no press is reported, no arrow is claimed, and no live region mounts.
	 *
	 * An explicit prop rather than "there is no `onCellPress`" — a screen that
	 * forgets the handler would silently lose the semantics too, and a screen
	 * that wants a rendered-but-dead board would have no way to say so.
	 */
	interactive?: boolean
	/**
	 * Overrides the group's accessible name. A board that cannot be played is
	 * decoration belonging to the screen around it, and "Board, 3 by 3" names a
	 * thing to play — so that screen says what its copy of the board is for.
	 */
	label?: string
	/**
	 * Shows the designed footer inside the wood: the standing hint and both game
	 * controls. Off by default — the board Figma draws by default has none.
	 */
	footer?: boolean
	/**
	 * The standing line in the footer. Defaults to the copy that tells a new
	 * player how to move a tile; a screen that has something better to say —
	 * "Solved" — passes its own.
	 *
	 * Deliberately not derived from the board: an unshuffled board is solved
	 * too, so a Board that worked it out itself would announce the win before
	 * the first shuffle. Only the screen owning the lifecycle knows the
	 * difference.
	 */
	hint?: ReactNode
	/**
	 * Shows the solved picture as a glass chip beside the hint. Only rendered
	 * inside the footer, and on by default there — the same default the Figma
	 * component property carries.
	 */
	preview?: boolean
	/**
	 * Paints each tile's number on it. Off by default — the board Figma draws
	 * carries no numbers.
	 *
	 * Visual only: a tile is named "Tile 3" by its `aria-label` either way, so
	 * this changes nothing a screen reader reports and nothing is announced when
	 * it flips.
	 */
	numbered?: boolean
	/**
	 * Called when the restart control is pressed. Board does not deal the new
	 * board; `game.restart` belongs to whoever composes it.
	 */
	onRestart?: () => void
	/**
	 * Called when the abandon control is pressed. Board neither confirms nor
	 * leaves: the design's "your moves will not be recorded" Dialog and the
	 * navigation behind it belong to whoever composes it.
	 */
	onAbandon?: () => void
	/** Overrides the BASE testid. */
	dataTestId?: string
}

const NO_ANNOUNCEMENT: Announcement = { text: '', move: 0 }

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
 *   (ADR-0014), from anywhere on the screen. An accelerator for the single
 *   adjacent move; runs go through Tab.
 *
 * Arrows are live screen-wide: the tile they name is fixed by the gap, not by
 * whatever holds focus, so the listener sits on `window` and a player never
 * has to Tab in before playing. Three bails scope it — an open dialog anywhere
 * in the document keeps every arrow (the board must not play itself behind a
 * scrim, and a dialog that owns arrows must keep them), a Ctrl/⌘/Alt chord
 * stays the browser's, and a held key's repeats move nothing while still
 * being claimed so the page never starts scrolling mid-hold. Which is also
 * the standing constraint: mount at most one interactive Board per screen,
 * or a single keypress plays them all.
 *
 * An arrow-driven move leaves no focus ring behind: the press flags this
 * container `data-input="arrow"`, and the stylesheet hides the ring on tiles
 * only — a footer control's ring is the player's place in the Tab order,
 * which an arrow press does not invalidate. Focus itself never moves, so
 * tabbing to a far tile for a multi-cell run survives every arrow. The flag
 * clears when focus genuinely moves or a pointer goes down.
 *
 * Tiles render in tile order rather than cell order, so a move animates the same
 * element from its old cell to its new one instead of remounting it elsewhere.
 *
 * With `footer`, the two game controls become the last tab stops after the
 * movable tiles — abandon, then restart. Arrows stay screen-wide there: they
 * name a tile by the gap, not by what holds focus, and a button has no native
 * arrow behaviour to displace.
 *
 * `interactive={false}` withdraws all of that. The board paints exactly as it
 * does when played and answers nothing: no tab stop, no press, no arrow, no live
 * region, and the accessible name its screen gives it instead of the dimensions.
 */
export const Board: FC<BoardProps> = ({
	board,
	sourceImage,
	interactive = true,
	label,
	footer = false,
	hint = <Message message={boardMessages.hint} />,
	preview = true,
	numbered = false,
	onCellPress,
	onRestart,
	onAbandon,
	dataTestId,
}) => {
	const [announcement, setAnnouncement] = useState(NO_ANNOUNCEMENT)
	const [arrowInput, setArrowInput] = useState(false)
	const announcedBoard = useRef(board)
	const focusHolder = useRef<EventTarget | null>(null)
	const { translate } = useTranslate()
	const base = dataTestId ?? BOARD_TESTIDS.BASE
	const movable = movableTiles(board)
	const placements = toPlacements(board)
	const SourceImage = SOURCE_IMAGES[sourceImage]

	// Announced from the board that arrived, not from the press that asked for
	// it: a press this component sends outward may never come back as a move —
	// the machine ignores one outside `playing` — and a live region that reports
	// intent rather than fact lies to the only people relying on it.
	if (announcedBoard.current !== board) {
		const moves = movesBetween(announcedBoard.current, board)
		announcedBoard.current = board
		const [first] = moves
		const direction = first ? directionOfMove(board, first) : undefined

		// Every tile a press relocates travels the same way, so the first move
		// speaks for all of them — and a board whose tiles went several ways at
		// once was not played, it was replaced. A deal, a restart or a change of
		// size is not a move, and the sentence below could only misdescribe it.
		if (
			interactive &&
			direction &&
			moves.every((move) => directionOfMove(board, move) === direction)
		) {
			const text = translate(boardMessages.moveAnnouncement, {
				count: moves.length,
				direction,
			})
			setAnnouncement((previous) => ({ text, move: previous.move + 1 }))
		}
	}

	const wellStyle: WellStyle = {
		'--board-rows': board.rows,
		'--board-cols': board.cols,
	}

	const cellStyle = (cell: CellIndex): CellStyle => ({
		'--cell-row': Math.floor(cell / board.cols),
		'--cell-col': cell % board.cols,
	})

	const pressCell = (cell: CellIndex) => {
		if (!interactive) return
		if (movesForCell(board, cell).length > 0) onCellPress?.(cell)
	}

	// Screen-wide, so the listener lives on `window`, and per board: each press
	// must read the arrangement actually on screen. An inert board attaches
	// nothing, leaving every key to the screen it decorates.
	useEffect(() => {
		if (!interactive) return undefined

		const handleWindowKeyDown = (event: globalThis.KeyboardEvent) => {
			const direction = DIRECTION_BY_KEY[event.key]
			if (!direction) return

			// A modal dialog makes the background inert for pointers, but a keydown
			// still bubbles here from inside it. Bail before claiming anything:
			// the board must not play itself behind the scrim, and a dialog that
			// owns arrows — a radio group, a scrollable body — must keep them.
			// Asked of the document rather than of this screen: two of the dialogs
			// that open over Play are mounted above it and it cannot see them.
			const aDialogIsOpen = document.querySelector('dialog[open]') !== null
			if (aDialogIsOpen) return

			// A chorded arrow is history navigation (Alt+←/→, ⌘+←/→), never a move.
			if (event.ctrlKey || event.metaKey || event.altKey) return

			// Claimed whether or not a tile answers, so a blocked direction never
			// falls through to scrolling the page instead. Space, PageUp/PageDown
			// and Home/End remain as scroll routes.
			event.preventDefault()
			setArrowInput(true)

			// One press is one move; a held arrow keeps being claimed above, or
			// it would start scrolling the page after the first move.
			if (event.repeat) return

			const cell = cellForDirection(board, direction)
			if (cell !== null) pressCell(cell)
		}

		window.addEventListener('keydown', handleWindowKeyDown)
		return () => window.removeEventListener('keydown', handleWindowKeyDown)
		// `pressCell` closes over the board and the handler, so it stands for
		// both: a listener attached to a stale one would play the arrangement
		// the player has already moved on from.
	}, [interactive, pressCell])

	// The ring-suppression flag's clearing signals. `focusin` where focus
	// actually moved is the honest one — it covers Tab, Shift+Tab and
	// programmatic moves alike, while a window regaining focus re-fires it on
	// the element that already held it, whose ring the player still owns.
	// `pointerdown` covers a click landing on the already-focused tile, which
	// moves no focus at all.
	useEffect(() => {
		if (!interactive) return undefined

		focusHolder.current = document.activeElement

		const handleFocusIn = (event: FocusEvent) => {
			const moved = event.target !== focusHolder.current
			focusHolder.current = event.target
			if (moved) setArrowInput(false)
		}

		const handlePointerDown = () => setArrowInput(false)

		window.addEventListener('focusin', handleFocusIn)
		window.addEventListener('pointerdown', handlePointerDown)
		return () => {
			window.removeEventListener('focusin', handleFocusIn)
			window.removeEventListener('pointerdown', handlePointerDown)
		}
	}, [interactive])

	return (
		<div
			className={styles.board}
			data-testid={base}
			role="group"
			aria-label={
				label ?? translate(boardMessages.label, { rows: board.rows, cols: board.cols })
			}
			data-input={arrowInput ? 'arrow' : undefined}
		>
			<span className={styles.bevel} />
			<div className={styles.well} style={wellStyle}>
				<div className={styles.cells}>
					{placements.map(({ tile, cell }) => (
						<div key={tile} className={styles.cell} style={cellStyle(cell)}>
							<Tile
								tile={tile}
								sourceImage={sourceImage}
								rows={board.rows}
								cols={board.cols}
								movable={interactive && movable.includes(tile)}
								showLabel={numbered}
								onPress={() => pressCell(cell)}
								dataTestId={`${base}${BOARD_TESTIDS.TILE_SUFFIX}-${tile}`}
							/>
						</div>
					))}
					<div
						className={styles.gap}
						data-testid={`${base}${BOARD_TESTIDS.GAP_SUFFIX}`}
						style={cellStyle(gapCell(board))}
						aria-hidden
					/>
				</div>
			</div>
			{footer && (
				<div className={styles.footer}>
					<div className={styles.footerLeading}>
						{preview && (
							// Named rather than hidden: it is the goal of the game, not
							// decoration. The name sits on the chip and the artwork stays
							// `aria-hidden`, so it is announced once. The design's tooltip
							// is deliberately dropped — it hangs off hover on a
							// non-focusable element, so a keyboard user could never reach it.
							<span
								className={styles.preview}
								data-testid={`${base}${BOARD_TESTIDS.PREVIEW_SUFFIX}`}
								role="img"
								aria-label={translate(boardMessages.preview)}
							>
								<SourceImage className={styles.previewImage} aria-hidden />
								<span className={styles.previewSheen} />
							</span>
						)}
						<p className={styles.hint}>{hint}</p>
					</div>
					<div className={styles.actions}>
						<IconButton
							icon="x"
							label={translate(boardMessages.abandon)}
							variant="onWood"
							size="md"
							onClick={onAbandon}
							dataTestId={`${base}${BOARD_TESTIDS.ABANDON_SUFFIX}`}
						/>
						<IconButton
							icon="rotate-ccw"
							label={translate(boardMessages.restart)}
							variant="onWood"
							size="md"
							onClick={onRestart}
							dataTestId={`${base}${BOARD_TESTIDS.RESTART_SUFFIX}`}
						/>
					</div>
				</div>
			)}
			{/* Not mounted at all on an inert board: an empty live region is still a
			    live region, and a screen reader that lists them would offer one that
			    can never speak. `role="status"` already implies polite and atomic;
			    both are spelled out because older screen readers honour the
			    attributes and not the role, and the role is what gives tests an
			    accessible query. */}
			{interactive && (
				<div
					className={styles.announcer}
					role="status"
					aria-live="polite"
					aria-atomic="true"
				>
					{/* Keyed by move count, not by text. Two identical moves in a row
					    produce the same sentence, and rewriting a live region with the
					    string already in it mutates no DOM, so nothing is announced.
					    Replacing the child node makes every move a fresh utterance. */}
					<span
						key={announcement.move}
						data-testid={`${base}${BOARD_TESTIDS.ANNOUNCER_SUFFIX}`}
					>
						{announcement.text}
					</span>
				</div>
			)}
		</div>
	)
}
