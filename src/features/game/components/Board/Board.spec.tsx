import type { Board as BoardModel, CellIndex, TileId } from '@engine'
import { GAP } from '@engine'
import { createTranslate } from '@i18n'
import { renderWithProviders } from '@testing'
import type { RenderResult } from '@testing-library/react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

const renderComponent = (props: Partial<BoardProps> = {}): RenderResult =>
	renderWithProviders(<Board board={gapCentre} sourceImage="sailboat" {...props} />)

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

			const reached: (string | null)[] = []
			for (let step = 0; step < 4; step += 1) {
				await user.tab()
				reached.push(document.activeElement?.getAttribute('aria-label') ?? null)
			}

			// Tiles 1, 3, 4 and 6 are the movable ones; DOM order is tile order.
			expect(reached).toEqual([tileName(1), tileName(3), tileName(4), tileName(6)])
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
			renderComponent()
			const announcer = screen.getByRole('status')
			expect(announcer).toBeEmptyDOMElement()
		})

		it('announces a single move in the direction the tile travelled', async () => {
			const user = userEvent.setup()
			renderComponent()

			const tile = screen.getByRole('button', { name: tileName(3) })
			await user.click(tile)

			const announcer = screen.getByRole('status')
			expect(announcer).toHaveTextContent(
				translate(boardMessages.moveAnnouncement, { count: 1, direction: 'right' }),
			)
		})

		it('announces a run as one utterance counting every tile it moved', async () => {
			const user = userEvent.setup()
			renderComponent({ board: gapWideBoard })

			const farTile = screen.getByRole('button', { name: tileName(2) })
			await user.click(farTile)

			const announcer = screen.getByRole('status')
			expect(announcer).toHaveTextContent(
				translate(boardMessages.moveAnnouncement, { count: 3, direction: 'left' }),
			)
		})

		it('phrases an arrow press exactly as it phrases a pointer press', async () => {
			const user = userEvent.setup()
			renderComponent()

			await user.tab()
			await user.keyboard('{ArrowLeft}')

			const announcer = screen.getByRole('status')
			expect(announcer).toHaveTextContent(
				translate(boardMessages.moveAnnouncement, { count: 1, direction: 'left' }),
			)
		})

		it('announces in the active locale', async () => {
			const user = userEvent.setup()
			// eslint-disable-next-line sliding-puzzle/render-through-render-component -- the helper takes props only; this case needs a render option
			renderWithProviders(<Board board={gapCentre} sourceImage="sailboat" />, {
				locale: 'nl',
			})

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

	it('marks the empty cell without giving it an accessible identity', () => {
		renderComponent()
		const gap = screen.getByTestId(`${BOARD_TESTIDS.BASE}${BOARD_TESTIDS.GAP_SUFFIX}`)
		expect(gap).toHaveAttribute('aria-hidden', 'true')
	})
})
