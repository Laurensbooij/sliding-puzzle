import type { TileId } from '@engine'
import { createTranslate } from '@i18n'
import { renderWithProviders } from '@testing'
import type { RenderWithProvidersOptions } from '@testing'
import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Tile } from './Tile'
import type { TileProps } from './Tile'
import { TILE_TESTIDS } from './constants'
import { tileMessages } from './translation-messages'

const { translate } = createTranslate()
const tileName = (number: number) => translate(tileMessages.label, { number })

/** The first tile of a solved 3×3 board — each test overrides only what it is about. */
const DEFAULT_PROPS = {
	tile: 0,
	sourceImage: 'sailboat',
	rows: 3,
	cols: 3,
} satisfies TileProps

const renderComponent = (props: Partial<TileProps> = {}, options?: RenderWithProvidersOptions) =>
	renderWithProviders(<Tile {...DEFAULT_PROPS} {...props} />, options)

const fragmentImageOf = (testId: string = TILE_TESTIDS.BASE) =>
	screen.getByTestId(`${testId}${TILE_TESTIDS.IMAGE_SUFFIX}`)

/**
 * Announcements are N/A here: a tile has no state to announce on its own. A
 * move changes the board, and the board owns the live region that reports it.
 */
describe('Tile', () => {
	it('is a button named after its 1-based label', () => {
		renderComponent()

		const tileButton = screen.getByRole('button', { name: tileName(1) })
		expect(tileButton).toBeVisible()
	})

	it('reports its tile id when pressed while movable', async () => {
		const user = userEvent.setup()
		const onPress = vi.fn<NonNullable<TileProps['onPress']>>()
		renderComponent({ tile: 3, movable: true, onPress })

		const tileButton = screen.getByRole('button', { name: tileName(4) })
		await user.click(tileButton)

		expect(onPress).toHaveBeenCalledExactlyOnceWith(3)
	})

	it('is operable from the keyboard with Enter and Space', async () => {
		const user = userEvent.setup()
		const onPress = vi.fn<NonNullable<TileProps['onPress']>>()
		renderComponent({ tile: 3, movable: true, onPress })

		const tileButton = screen.getByRole('button', { name: tileName(4) })
		await user.tab()
		expect(tileButton).toHaveFocus()

		await user.keyboard('{Enter}')
		await user.keyboard(' ')

		expect(onPress.mock.calls).toEqual([[3], [3]])
	})

	it('cannot produce a move when not movable, but stays keyboard-reachable', async () => {
		const user = userEvent.setup()
		const onPress = vi.fn<NonNullable<TileProps['onPress']>>()
		renderComponent({ tile: 3, onPress })

		const tileButton = screen.getByRole('button', { name: tileName(4) })

		// Never `disabled`: movability flips every move, and dropping out of the
		// tab order would destroy a keyboard user's focus mid-game.
		await user.tab()
		expect(tileButton).toHaveFocus()
		expect(tileButton).toBeEnabled()

		await user.click(tileButton)
		expect(tileButton).toHaveAttribute('aria-disabled', 'true')
		expect(onPress).not.toHaveBeenCalled()
	})

	it('hides the assist label without losing its accessible name', () => {
		renderComponent({ tile: 7, showLabel: false })

		const tileButton = screen.getByRole('button', { name: tileName(8) })
		const label = screen.queryByText('8')
		expect(tileButton).toBeVisible()
		expect(label).not.toBeInTheDocument()
	})

	it.each<[TileProps['tile'], number]>([
		[0, 1],
		[4, 5],
		[8, 9],
	])('labels tile id %i as tile number %i', (tile, number) => {
		renderComponent({ tile })

		const tileButton = screen.getByRole('button', { name: tileName(number) })
		expect(tileButton).toBeVisible()
	})

	it('translates its accessible name into the active locale', () => {
		renderComponent({}, { locale: 'nl' })

		const dutchTranslate = createTranslate('nl').translate
		const tileButton = screen.getByRole('button', {
			name: dutchTranslate(tileMessages.label, { number: 1 }),
		})
		expect(tileButton).toBeVisible()
	})

	it('lets a collection override the base testid', () => {
		const overrideTestId = `board-${TILE_TESTIDS.BASE}-2`
		renderComponent({ tile: 2, dataTestId: overrideTestId })

		const tileButton = screen.getByTestId(overrideTestId)
		const fragmentImage = fragmentImageOf(overrideTestId)
		expect(tileButton).toBeVisible()
		expect(fragmentImage).toBeVisible()
	})

	it('carries the named source image inline, so the tile ink can reach it', () => {
		const rocketTestId = `${TILE_TESTIDS.BASE}-rocket`
		const catTestId = `${TILE_TESTIDS.BASE}-cat`
		renderComponent({ sourceImage: 'rocket', dataTestId: rocketTestId })
		renderComponent({ sourceImage: 'cat', dataTestId: catTestId })

		const rocketFragment = fragmentImageOf(rocketTestId)
		const catFragment = fragmentImageOf(catTestId)

		// Inline rather than an `<img>`: an image document resolves the source
		// image's `currentColor` strokes to black, out of the tile's reach.
		expect(rocketFragment.tagName).toBe('svg')
		// The tile's accessible name already names it; the image adds nothing.
		expect(rocketFragment).toHaveAttribute('aria-hidden', 'true')
		expect(rocketFragment.innerHTML).not.toBe(catFragment.innerHTML)
	})

	it.each<[TileId, number, number, number, number]>([
		[0, 3, 3, 0, 0],
		[5, 3, 3, 2, 1],
		[8, 3, 3, 2, 2],
		[6, 2, 4, 2, 1],
	])(
		'sizes tile %i to a %i×%i board and offsets it to column %i, row %i',
		(tile, rows, cols, column, row) => {
			renderComponent({ tile, rows, cols })

			const fragmentImage = fragmentImageOf()
			const geometry = {
				cols: fragmentImage.style.getPropertyValue('--fragment-cols'),
				rows: fragmentImage.style.getPropertyValue('--fragment-rows'),
				col: fragmentImage.style.getPropertyValue('--fragment-col'),
				row: fragmentImage.style.getPropertyValue('--fragment-row'),
			}

			expect(geometry).toEqual({
				cols: String(cols),
				rows: String(rows),
				col: String(column),
				row: String(row),
			})
		},
	)
})
