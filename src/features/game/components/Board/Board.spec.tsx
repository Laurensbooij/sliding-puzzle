import type { Board as BoardModel, CellIndex, TileId } from '@engine'
import { GAP, applyMove, movesForCell } from '@engine'
import { createTranslate } from '@i18n'
import type { RenderWithProvidersOptions } from '@testing'
import { renderWithProviders } from '@testing'
import type { RenderResult } from '@testing-library/react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FC } from 'react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { tileMessages } from '../Tile/translation-messages'
import { Board } from './Board'
import type { BoardProps } from './Board'
import { BOARD_TESTIDS } from './constants'
import { boardMessages } from './translation-messages'

const { translate } = createTranslate()

const boardOf = (
	rows: number,
	cols: number,
	cells: readonly (TileId | typeof GAP)[],
): BoardModel => ({ rows, cols, cells })

// 3x3, gap in the centre (cell 4), so all four arrows have a tile to name.
const gapCentre = boardOf(3, 3, [0, 1, 2, 3, GAP, 4, 5, 6, 7])

// 3x3, gap in the top-left corner — 'down' and 'right' name nothing.
const gapTopLeft = boardOf(3, 3, [GAP, 0, 1, 2, 3, 4, 5, 6, 7])

// 2x4, gap at the start of the top row: pressing cell 3 slides a run of three.
const gapWideBoard = boardOf(2, 4, [GAP, 0, 1, 2, 3, 4, 5, 6])

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

const renderComponent = (
	{ stateful = false, ...props }: Partial<BoardProps> & { stateful?: boolean } = {},
	options?: RenderWithProvidersOptions,
): RenderResult => {
	const merged = { board: gapCentre, sourceImage: 'sailboat', ...props } satisfies BoardProps
	return renderWithProviders(
		stateful ? <StatefulBoard {...merged} /> : <Board {...merged} />,
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

		it('leaves arrow keys alone until focus is inside the board', async () => {
			const user = userEvent.setup()
			const onCellPress = vi.fn()
			renderComponent({ onCellPress })

			await user.keyboard('{ArrowRight}')

			expect(onCellPress).not.toHaveBeenCalled()
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
		it('shows neither the hint nor the game controls by default', () => {
			renderComponent()
			for (const message of [boardMessages.restart, boardMessages.abandon]) {
				const control = screen.queryByRole('button', { name: translate(message) })
				expect(control).not.toBeInTheDocument()
			}
		})

		it('names both game controls for assistive technology', () => {
			renderComponent({ footer: true })
			for (const message of [boardMessages.abandon, boardMessages.restart]) {
				const control = screen.getByRole('button', { name: translate(message) })
				expect(control).toBeInTheDocument()
			}
		})

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

		it('translates the footer with the rest of the board', () => {
			renderComponent({ footer: true }, { locale: 'nl' })

			const { translate: translateDutch } = createTranslate('nl')
			for (const message of [boardMessages.abandon, boardMessages.restart]) {
				const control = screen.getByRole('button', { name: translateDutch(message) })
				expect(control).toBeInTheDocument()
			}
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
