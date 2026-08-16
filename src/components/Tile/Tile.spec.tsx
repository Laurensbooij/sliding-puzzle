import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Tile } from './Tile'
import { TILE_TESTIDS } from './constants'
import type { TileProps } from './types'

describe('Tile', () => {
	it('is a button named after its 1-based label', () => {
		render(<Tile tile={0} />)

		const tileButton = screen.getByRole('button', { name: 'Tile 1' })
		expect(tileButton).toBeVisible()
	})

	it('reports its tile id when pressed while movable', async () => {
		const user = userEvent.setup()
		const onPress = vi.fn<NonNullable<TileProps['onPress']>>()
		render(<Tile tile={3} movable onPress={onPress} />)

		const tileButton = screen.getByRole('button', { name: 'Tile 4' })
		await user.click(tileButton)

		expect(onPress).toHaveBeenCalledExactlyOnceWith(3)
	})

	it('is disabled when not movable, so it cannot produce a move', async () => {
		const user = userEvent.setup()
		const onPress = vi.fn<NonNullable<TileProps['onPress']>>()
		render(<Tile tile={3} onPress={onPress} />)

		const tileButton = screen.getByRole('button', { name: 'Tile 4' })
		await user.click(tileButton)

		expect(tileButton).toBeDisabled()
		expect(onPress).not.toHaveBeenCalled()
	})

	it('hides the assist label without losing its accessible name', () => {
		render(<Tile tile={7} showLabel={false} />)

		const tileButton = screen.getByRole('button', { name: 'Tile 8' })
		const label = screen.queryByTestId(`${TILE_TESTIDS.BASE}${TILE_TESTIDS.LABEL_SUFFIX}`)
		expect(tileButton).toBeVisible()
		expect(label).not.toBeInTheDocument()
	})

	it.each<[TileProps['tile'], string]>([
		[0, 'Tile 1'],
		[4, 'Tile 5'],
		[8, 'Tile 9'],
	])('labels tile id %i as "%s"', (tile, accessibleName) => {
		render(<Tile tile={tile} />)

		const tileButton = screen.getByRole('button', { name: accessibleName })
		expect(tileButton).toBeVisible()
	})

	it('lets a collection override the base testid', () => {
		render(<Tile tile={2} dataTestId="board-tile-2" />)

		const tileButton = screen.getByTestId('board-tile-2')
		expect(tileButton).toBeVisible()
	})
})
