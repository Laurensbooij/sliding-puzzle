import type { Board as BoardModel, CellIndex, TileId } from '@engine'
import { GAP, applyMove, movesForCell } from '@engine'
import type { TranslationMessage } from '@i18n'
import { createTranslate } from '@i18n'
import type { RenderWithProvidersOptions } from '@testing'
import { renderWithProviders } from '@testing'
import type { RenderResult } from '@testing-library/react'
import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FC } from 'react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Board } from './Board'
import type { BoardProps } from './Board'
import { tileMessages } from './Tile/translation-messages'
import { BOARD_TESTIDS } from './constants'
import { boardMessages } from './translation-messages'

const { translate } = createTranslate()

const boardOf = (
	rows: number,
	cols: number,
	cells: readonly (TileId | typeof GAP)[],
): BoardModel => ({ rows, cols, cells })

/** The footer's two controls, in the order they take focus. */
const GAME_CONTROLS: [string, TranslationMessage][] = [
	['abandon', boardMessages.abandon],
	['restart', boardMessages.restart],
]

// 3x3, gap in the centre (cell 4), so all four arrows have a tile to name.
const gapCentre = boardOf(3, 3, [0, 1, 2, 3, GAP, 4, 5, 6, 7])

// 3x3, gap in the top-left corner — 'down' and 'right' name nothing.
const gapTopLeft = boardOf(3, 3, [GAP, 0, 1, 2, 3, 4, 5, 6, 7])

// 2x4, gap at the start of the top row: pressing cell 3 slides a run of three.
const gapWideBoard = boardOf(2, 4, [GAP, 0, 1, 2, 3, 4, 5, 6])

// `gapCentre` after two presses in different directions — tile 3 down, then
// tile 5 left. No single press reaches it, so it stands in for every board that
// was replaced rather than played: a deal, a restart, a change of size.
const replacedBoard = boardOf(3, 3, [0, 1, GAP, 3, 4, 2, 5, 6, 7])

/** The accessible name Tile renders for a tile id — 1-based, as the user hears it. */
const tileName = (tile: TileId): string => translate(tileMessages.label, { number: tile + 1 })

/**
 * Board announces the board it is handed, never the press it sent out, so any
 * case about announcements needs something that actually applies the move. This
 * is the game machine's job in the app; here it is the smallest honest stand-in.
 */
type StatefulBoardProps = Omit<BoardProps, 'onCellPress'>

const StatefulBoard: FC<StatefulBoardProps> = ({ board: initial, ...props }) => {
	const [board, setBoard] = useState(initial)
	return (
		<Board
			{...props}
			board={board}
			onCellPress={(cell) =>
				setBoard((current) => movesForCell(current, cell).reduce(applyMove, current))
			}
		/>
	)
}

/** What the screen around the board contributes: a focusable neighbour. */
const OUTSIDE_LABEL = 'Outside the board'

const renderComponent = (
	{
		stateful = false,
		outside = false,
		...props
	}: Partial<BoardProps> & { stateful?: boolean; outside?: boolean } = {},
	options?: RenderWithProvidersOptions,
): RenderResult => {
	const merged = { board: gapCentre, sourceImage: 'sailboat', ...props } satisfies BoardProps
	const rendered = stateful ? <StatefulBoard {...merged} /> : <Board {...merged} />
	return renderWithProviders(
		outside ? (
			<>
				<button type="button">{OUTSIDE_LABEL}</button>
				{rendered}
			</>
		) : (
			rendered
		),
		options,
	)
}

describe('Board', () => {
	it('exposes itself as a group named for its dimensions', () => {
		renderComponent({ board: gapWideBoard })
		const board = screen.getByRole('group', {
			name: translate(boardMessages.label, { rows: 2, cols: 4 }),
		})
		expect(board).toBeInTheDocument()
	})

	it('renders one tile per occupied cell and none for the gap', () => {
		renderComponent()
		const tiles = screen.getAllByRole('button')
		expect(tiles).toHaveLength(gapCentre.cells.length - 1)
	})

	describe('keyboard operation map', () => {
		it('makes only the tiles sharing the gap row or column tab stops', async () => {
			const user = userEvent.setup()
			renderComponent()

			// Tiles 1, 3, 4 and 6 are the movable ones; DOM order is tile order.
			for (const tile of [1, 3, 4, 6]) {
				await user.tab()
				const reached = screen.getByRole('button', { name: tileName(tile) })
				expect(reached).toHaveFocus()
			}
		})

		it('puts both game controls after the tiles, abandon then restart', async () => {
			const user = userEvent.setup()
			renderComponent({ footer: true })

			for (const tile of [1, 3, 4, 6]) {
				await user.tab()
				const reached = screen.getByRole('button', { name: tileName(tile) })
				expect(reached).toHaveFocus()
			}

			await user.tab()
			const abandon = screen.getByRole('button', {
				name: translate(boardMessages.abandon),
			})
			expect(abandon).toHaveFocus()

			await user.tab()
			const restart = screen.getByRole('button', {
				name: translate(boardMessages.restart),
			})
			expect(restart).toHaveFocus()
		})

		it('still moves a tile when an arrow is pressed from the restart control', async () => {
			const user = userEvent.setup()
			const onCellPress = vi.fn()
			renderComponent({ footer: true, onCellPress })

			const restart = screen.getByRole('button', {
				name: translate(boardMessages.restart),
			})
			restart.focus()
			await user.keyboard('{ArrowRight}')

			expect(onCellPress).toHaveBeenCalledExactlyOnceWith(3)
		})

		it.each<[string, string, CellIndex]>([
			['Enter', '{Enter}', 1],
			['Space', ' ', 1],
		])('presses the focused tile on %s', async (_key, keys, expected) => {
			const user = userEvent.setup()
			const onCellPress = vi.fn()
			renderComponent({ onCellPress })

			await user.tab()
			await user.keyboard(keys)

			expect(onCellPress).toHaveBeenCalledExactlyOnceWith(expected)
		})

		// ADR-0014: the arrow names where the tile travels, so each one presses
		// the cell on the *opposite* side of the gap.
		it.each<[string, CellIndex]>([
			['{ArrowRight}', 3],
			['{ArrowLeft}', 5],
			['{ArrowDown}', 1],
			['{ArrowUp}', 7],
		])('presses the tile that travels %s into the gap', async (key, expected) => {
			const user = userEvent.setup()
			const onCellPress = vi.fn()
			renderComponent({ onCellPress })

			await user.tab()
			await user.keyboard(key)

			expect(onCellPress).toHaveBeenCalledExactlyOnceWith(expected)
		})

		it.each<[string]>([['{ArrowDown}'], ['{ArrowRight}']])(
			'does nothing on %s when the gap is against that edge',
			async (key) => {
				const user = userEvent.setup()
				const onCellPress = vi.fn()
				renderComponent({ board: gapTopLeft, onCellPress })

				await user.tab()
				await user.keyboard(key)

				expect(onCellPress).not.toHaveBeenCalled()
			},
		)

		it('ignores keys outside the operation map', async () => {
			const user = userEvent.setup()
			const onCellPress = vi.fn()
			renderComponent({ onCellPress })

			await user.tab()
			await user.keyboard('{Home}{End}{PageUp}x')

			expect(onCellPress).not.toHaveBeenCalled()
		})

		// SLI-71: arrows are the game's primary input, so they play the board
		// from anywhere on the screen — no Tab into a tile first.
		it('moves a tile on an arrow pressed before anything holds focus', async () => {
			const user = userEvent.setup()
			const onCellPress = vi.fn()
			renderComponent({ onCellPress })

			await user.keyboard('{ArrowRight}')

			expect(onCellPress).toHaveBeenCalledExactlyOnceWith(3)
		})

		it('moves a tile on an arrow pressed with focus outside the board', async () => {
			const user = userEvent.setup()
			const onCellPress = vi.fn()
			renderComponent({ onCellPress, outside: true })

			const neighbour = screen.getByRole('button', { name: OUTSIDE_LABEL })
			neighbour.focus()
			await user.keyboard('{ArrowRight}')

			expect(onCellPress).toHaveBeenCalledExactlyOnceWith(3)
		})

		// Screen-wide capture must not swallow Alt+←/→ and ⌘+←/→ history
		// navigation, so a chorded arrow is left entirely to the browser.
		it.each<['ctrlKey' | 'metaKey' | 'altKey']>([['ctrlKey'], ['metaKey'], ['altKey']])(
			'leaves an arrow chorded with %s to the browser',
			(modifier) => {
				const onCellPress = vi.fn()
				renderComponent({ onCellPress })

				const chord = new KeyboardEvent('keydown', {
					key: 'ArrowRight',
					cancelable: true,
					[modifier]: true,
				})
				window.dispatchEvent(chord)

				expect(onCellPress).not.toHaveBeenCalled()
				expect(chord.defaultPrevented).toBe(false)
			},
		)

		// One press is one move — but a held arrow keeps being claimed, or it
		// would start scrolling the page after the first move.
		it('moves nothing on a held arrow repeat yet still claims the key', () => {
			const onCellPress = vi.fn()
			renderComponent({ onCellPress })

			const repeat = new KeyboardEvent('keydown', {
				key: 'ArrowRight',
				cancelable: true,
				repeat: true,
			})
			window.dispatchEvent(repeat)

			expect(onCellPress).not.toHaveBeenCalled()
			expect(repeat.defaultPrevented).toBe(true)
		})

		// Half-swallowed arrows lurch the page exactly when the player is
		// already confused, so an illegal direction is claimed too.
		it('claims an arrow even when the gap is against that edge', () => {
			const onCellPress = vi.fn()
			renderComponent({ board: gapTopLeft, onCellPress })

			const blocked = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true })
			window.dispatchEvent(blocked)

			expect(onCellPress).not.toHaveBeenCalled()
			expect(blocked.defaultPrevented).toBe(true)
		})

		it('leaves the scroll keys unclaimed as scroll routes', () => {
			renderComponent()

			const scrollKey = new KeyboardEvent('keydown', { key: 'PageDown', cancelable: true })
			window.dispatchEvent(scrollKey)

			expect(scrollKey.defaultPrevented).toBe(false)
		})

		it('plays a multi-cell run by tabbing to the far tile and pressing it', async () => {
			const user = userEvent.setup()
			const onCellPress = vi.fn()
			renderComponent({ board: gapWideBoard, onCellPress })

			// Tile 2 sits at cell 3, two tiles beyond the gap's neighbour.
			const farTile = screen.getByRole('button', { name: tileName(2) })
			await user.click(farTile)

			expect(onCellPress).toHaveBeenCalledExactlyOnceWith(3)
		})
	})

	/**
	 * SLI-71: after an arrow-driven move the tile is no longer the centre of
	 * attention, so its ring must go — but focus itself never moves, keeping the
	 * player's place in the Tab order for multi-cell runs. The container carries
	 * `data-input="arrow"` while arrows drive the board; the stylesheet hides
	 * the ring on tiles only.
	 */
	describe('focus ring suppression', () => {
		const boardContainer = (): HTMLElement =>
			screen.getByRole('group', {
				name: translate(boardMessages.label, { rows: 3, cols: 3 }),
			})

		it('carries no arrow flag until an arrow is pressed', () => {
			renderComponent()

			const container = boardContainer()
			expect(container).not.toHaveAttribute('data-input')
		})

		it('flags the container for arrow input on an arrow press', async () => {
			const user = userEvent.setup()
			renderComponent()

			await user.tab()
			await user.keyboard('{ArrowRight}')

			const container = boardContainer()
			expect(container).toHaveAttribute('data-input', 'arrow')
		})

		it('keeps focus where it was when an arrow moves a tile', async () => {
			const user = userEvent.setup()
			renderComponent({ stateful: true })

			await user.tab()
			const focusedTile = screen.getByRole('button', { name: tileName(1) })
			await user.keyboard('{ArrowRight}')

			expect(focusedTile).toHaveFocus()
		})

		it('clears the flag when focus moves to another element', async () => {
			const user = userEvent.setup()
			renderComponent()

			await user.tab()
			await user.keyboard('{ArrowRight}')
			await user.tab()

			const container = boardContainer()
			expect(container).not.toHaveAttribute('data-input')
		})

		// A window that regains focus re-fires `focusin` on the element that
		// already held it — the player's place did not change, so the ring
		// stays hidden.
		it('keeps the flag on a focusin that lands on the already-focused tile', async () => {
			const user = userEvent.setup()
			renderComponent()

			await user.tab()
			const focusedTile = screen.getByRole('button', { name: tileName(1) })
			await user.keyboard('{ArrowRight}')
			fireEvent.focusIn(focusedTile)

			const container = boardContainer()
			expect(container).toHaveAttribute('data-input', 'arrow')
		})

		// A click landing on the already-focused tile moves no focus at all,
		// so `focusin` alone would leave the flag standing.
		it('clears the flag on a pointer press', async () => {
			const user = userEvent.setup()
			renderComponent()

			await user.tab()
			const focusedTile = screen.getByRole('button', { name: tileName(1) })
			await user.keyboard('{ArrowRight}')
			fireEvent.pointerDown(focusedTile)

			const container = boardContainer()
			expect(container).not.toHaveAttribute('data-input')
		})
	})

	describe('move announcements', () => {
		it('says nothing before the first move', () => {
			renderComponent({ stateful: true })
			const announcer = screen.getByRole('status')
			expect(announcer).toHaveTextContent('')
		})

		it('announces a single move in the direction the tile travelled', async () => {
			const user = userEvent.setup()
			renderComponent({ stateful: true })

			const tile = screen.getByRole('button', { name: tileName(3) })
			await user.click(tile)

			const announcer = screen.getByRole('status')
			expect(announcer).toHaveTextContent(
				translate(boardMessages.moveAnnouncement, { count: 1, direction: 'right' }),
			)
		})

		it('announces a run as one utterance counting every tile it moved', async () => {
			const user = userEvent.setup()
			renderComponent({ board: gapWideBoard, stateful: true })

			const farTile = screen.getByRole('button', { name: tileName(2) })
			await user.click(farTile)

			const announcer = screen.getByRole('status')
			expect(announcer).toHaveTextContent(
				translate(boardMessages.moveAnnouncement, { count: 3, direction: 'left' }),
			)
		})

		it('phrases an arrow press exactly as it phrases a pointer press', async () => {
			const user = userEvent.setup()
			renderComponent({ stateful: true })

			await user.tab()
			await user.keyboard('{ArrowLeft}')

			const announcer = screen.getByRole('status')
			expect(announcer).toHaveTextContent(
				translate(boardMessages.moveAnnouncement, { count: 1, direction: 'left' }),
			)
		})

		/**
		 * Two identical moves in a row produce the same sentence. Rewriting a live
		 * region with the text already in it mutates no DOM and announces nothing,
		 * so the region has to replace its child rather than restate it.
		 */
		it('replaces the announced node when a move repeats its wording', async () => {
			const user = userEvent.setup()
			// Wide enough that ArrowLeft is legal twice running, so the second
			// move produces the same sentence as the first.
			renderComponent({ board: gapWideBoard, stateful: true })

			const announcerId = `${BOARD_TESTIDS.BASE}${BOARD_TESTIDS.ANNOUNCER_SUFFIX}`

			await user.tab()
			await user.keyboard('{ArrowLeft}')
			const firstNode = screen.getByTestId(announcerId)

			await user.keyboard('{ArrowLeft}')
			const secondNode = screen.getByTestId(announcerId)

			expect(secondNode).toHaveTextContent(
				translate(boardMessages.moveAnnouncement, { count: 1, direction: 'left' }),
			)
			expect(secondNode).not.toBe(firstNode)
		})

		it('says nothing when the board was replaced rather than played', () => {
			const { rerender } = renderComponent()

			rerender(<Board board={replacedBoard} sourceImage="sailboat" />)

			const announcer = screen.getByRole('status')
			expect(announcer).toHaveTextContent('')
		})

		it('stays silent when the press is never applied to a board', async () => {
			const user = userEvent.setup()
			renderComponent()

			const tile = screen.getByRole('button', { name: tileName(3) })
			await user.click(tile)

			const announcer = screen.getByRole('status')
			expect(announcer).toHaveTextContent('')
		})

		it('announces in the active locale', async () => {
			const user = userEvent.setup()
			renderComponent({ stateful: true }, { locale: 'nl' })

			const { translate: translateDutch } = createTranslate('nl')
			const tile = screen.getByRole('button', {
				name: translateDutch(tileMessages.label, { number: 4 }),
			})
			await user.click(tile)

			const announcer = screen.getByRole('status')
			expect(announcer).toHaveTextContent(
				translateDutch(boardMessages.moveAnnouncement, { count: 1, direction: 'right' }),
			)
		})
	})

	describe('footer', () => {
		it('shows no hint by default', () => {
			renderComponent()
			const hint = screen.queryByText(translate(boardMessages.hint))
			expect(hint).not.toBeInTheDocument()
		})

		it.each(GAME_CONTROLS)(
			'keeps the %s control off a board with no footer',
			(_name, message) => {
				renderComponent()
				const control = screen.queryByRole('button', { name: translate(message) })
				expect(control).not.toBeInTheDocument()
			},
		)

		it.each(GAME_CONTROLS)(
			'names the %s control for assistive technology',
			(_name, message) => {
				renderComponent({ footer: true })
				const control = screen.getByRole('button', { name: translate(message) })
				expect(control).toBeInTheDocument()
			},
		)

		it('shows the solved picture, named rather than hidden', () => {
			renderComponent({ footer: true })
			const preview = screen.getByRole('img', {
				name: translate(boardMessages.preview),
			})
			expect(preview).toBeInTheDocument()
		})

		it('drops the preview when it is turned off', () => {
			renderComponent({ footer: true, preview: false })
			const preview = screen.queryByRole('img', {
				name: translate(boardMessages.preview),
			})
			expect(preview).not.toBeInTheDocument()
		})

		it('keeps the preview out of the board entirely when there is no footer', () => {
			renderComponent({ preview: true })
			const preview = screen.queryByRole('img', {
				name: translate(boardMessages.preview),
			})
			expect(preview).not.toBeInTheDocument()
		})

		it('leaves the preview out of the tab order', async () => {
			const user = userEvent.setup()
			renderComponent({ footer: true })

			for (const tile of [1, 3, 4, 6]) {
				await user.tab()
				const reached = screen.getByRole('button', { name: tileName(tile) })
				expect(reached).toHaveFocus()
			}

			// The preview sits before both controls in the DOM, so the tab that
			// follows the tiles would land on it if it were focusable.
			await user.tab()
			const abandon = screen.getByRole('button', {
				name: translate(boardMessages.abandon),
			})
			expect(abandon).toHaveFocus()
		})

		it('carries the standing hint as text', () => {
			renderComponent({ footer: true })
			const hint = screen.getByText(translate(boardMessages.hint))
			expect(hint).toBeInTheDocument()
		})

		it('shows a caller-supplied line in place of the standing hint', () => {
			renderComponent({ footer: true, hint: 'Solved' })
			const suppliedHint = screen.getByText('Solved')
			const standingHint = screen.queryByText(translate(boardMessages.hint))

			expect(suppliedHint).toBeInTheDocument()
			expect(standingHint).not.toBeInTheDocument()
		})

		it('reports a restart without dealing the board itself', async () => {
			const user = userEvent.setup()
			const onRestart = vi.fn()
			renderComponent({ footer: true, onRestart })

			const restart = screen.getByRole('button', {
				name: translate(boardMessages.restart),
			})
			await user.click(restart)

			expect(onRestart).toHaveBeenCalledOnce()
		})

		it('reports an abandon without leaving or confirming anything itself', async () => {
			const user = userEvent.setup()
			const onAbandon = vi.fn()
			renderComponent({ footer: true, onAbandon })

			const abandon = screen.getByRole('button', {
				name: translate(boardMessages.abandon),
			})
			await user.click(abandon)

			expect(onAbandon).toHaveBeenCalledOnce()
		})

		it('says nothing in the live region when the board is restarted', async () => {
			const user = userEvent.setup()
			renderComponent({ footer: true, onRestart: vi.fn() })

			const restart = screen.getByRole('button', {
				name: translate(boardMessages.restart),
			})
			await user.click(restart)

			const announcer = screen.getByRole('status')
			expect(announcer).toHaveTextContent('')
		})

		it.each(GAME_CONTROLS)(
			'translates the %s control with the rest of the board',
			(_name, message) => {
				renderComponent({ footer: true }, { locale: 'nl' })

				const { translate: translateDutch } = createTranslate('nl')
				const control = screen.getByRole('button', { name: translateDutch(message) })
				expect(control).toBeInTheDocument()
			},
		)
	})

	describe('numbered', () => {
		/** Every tile on `gapCentre` — the board every case here renders. */
		const tilesOnBoard = gapCentre.cells.filter((cell): cell is TileId => cell !== GAP)

		/** The number a tile paints, as a string — 1-based, like its name. */
		const tileNumber = (tile: TileId): string => String(tile + 1)

		it('paints no numbers by default', () => {
			renderComponent()
			const tile = screen.getByRole('button', { name: tileName(3) })
			const painted = within(tile).queryByText(tileNumber(3))
			expect(painted).not.toBeInTheDocument()
		})

		it('paints every tile its number when it is turned on', () => {
			renderComponent({ numbered: true })

			for (const tile of tilesOnBoard) {
				const button = screen.getByRole('button', { name: tileName(tile) })
				const painted = within(button).getByText(tileNumber(tile))
				expect(painted).toBeVisible()
			}
		})

		// The claim the whole setting rests on: it is paint, not identity, so a
		// screen-reader user hears the same board either way and nothing is
		// announced when it flips.
		it.each([false, true])(
			'leaves every accessible name untouched at numbered=%s',
			(numbered) => {
				renderComponent({ numbered })

				for (const tile of tilesOnBoard) {
					const named = screen.getByRole('button', { name: tileName(tile) })
					expect(named).toBeInTheDocument()
				}
			},
		)
	})

	describe('inert', () => {
		// What Setup names its decorative copy of the board. Board takes the string
		// rather than a message: the name belongs to the screen composing it, so
		// the message does too.
		const INERT_LABEL = 'The solved picture at 3×3'

		it('takes its accessible name from the caller', () => {
			renderComponent({ interactive: false, label: INERT_LABEL })
			const board = screen.getByRole('group', { name: INERT_LABEL })
			expect(board).toBeInTheDocument()
		})

		it('falls back to the dimensions when the caller names nothing', () => {
			renderComponent({ interactive: false })
			const board = screen.getByRole('group', {
				name: translate(boardMessages.label, { rows: 3, cols: 3 }),
			})
			expect(board).toBeInTheDocument()
		})

		it('still renders one tile per occupied cell', () => {
			renderComponent({ interactive: false, label: INERT_LABEL })
			const tiles = screen.getAllByRole('button')
			expect(tiles).toHaveLength(gapCentre.cells.length - 1)
		})

		it('offers no tab stop at all', async () => {
			const user = userEvent.setup()
			renderComponent({ interactive: false, label: INERT_LABEL })

			await user.tab()

			const tiles = screen.getAllByRole('button')
			for (const tile of tiles) {
				expect(tile).not.toHaveFocus()
			}
		})

		it('reports nothing when a tile is clicked', async () => {
			const user = userEvent.setup()
			const onCellPress = vi.fn()
			renderComponent({ interactive: false, label: INERT_LABEL, onCellPress })

			const tile = screen.getByRole('button', { name: tileName(3) })
			await user.click(tile)

			expect(onCellPress).not.toHaveBeenCalled()
		})

		// An interactive board hears arrows screen-wide (SLI-71), so the honest
		// proof is a press with focus nowhere near it: an inert board attaches
		// no listener at all, and the key stays the page's to scroll with.
		it('leaves the arrow keys to the screen around it', () => {
			const onCellPress = vi.fn()
			renderComponent({ interactive: false, label: INERT_LABEL, onCellPress })

			const arrow = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true })
			window.dispatchEvent(arrow)

			expect(onCellPress).not.toHaveBeenCalled()
			expect(arrow.defaultPrevented).toBe(false)
		})

		it('mounts no live region', () => {
			renderComponent({ interactive: false, label: INERT_LABEL })
			const announcer = screen.queryByRole('status')
			expect(announcer).not.toBeInTheDocument()
		})
	})

	it('marks the empty cell without giving it an accessible identity', () => {
		renderComponent()
		const gap = screen.getByTestId(`${BOARD_TESTIDS.BASE}${BOARD_TESTIDS.GAP_SUFFIX}`)
		expect(gap).toHaveAttribute('aria-hidden', 'true')
	})

	it('gives every tile its own testid, so a collection stays addressable', () => {
		renderComponent()
		const tile = screen.getByTestId(`${BOARD_TESTIDS.BASE}${BOARD_TESTIDS.TILE_SUFFIX}-3`)
		expect(tile).toHaveAccessibleName(tileName(3))
	})
})
