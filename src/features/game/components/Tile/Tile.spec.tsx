import { createTranslate } from '@i18n'
import { renderWithProviders } from '@testing'
import type { RenderWithProvidersOptions } from '@testing'
import type { RenderResult } from '@testing-library/react'
import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Tile } from './Tile'
import type { TileProps } from './Tile'
import { TILE_TESTIDS } from './constants'
import { tileMessages } from './translation-messages'

const { translate } = createTranslate()
const tileName = (number: number) => translate(tileMessages.label, { number })

const renderComponent = (
	props: Partial<TileProps> = {},
	options?: RenderWithProvidersOptions,
): RenderResult => renderWithProviders(<Tile tile={0} {...props} />, options)

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
		expect(tileButton).toBeVisible()
	})
})
