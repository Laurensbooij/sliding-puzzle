import { RECORDS_STORAGE_KEY } from '@/lib/records'
import { SETTINGS_STORAGE_KEY } from '@/lib/settings'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GAME_CONFIG_STORAGE_KEY } from '../constants'
import { useGameConfig } from '../use-game-config'
import { GameConfigProvider } from './GameConfigProvider'

const renderGameConfig = (stored?: string) => {
	if (stored !== undefined) localStorage.setItem(GAME_CONFIG_STORAGE_KEY, stored)
	return renderHook(() => useGameConfig(), { wrapper: GameConfigProvider })
}

describe('GameConfigProvider', () => {
	it('starts a first-time player on a 3x3 sailboat', () => {
		const { result } = renderGameConfig()

		expect(result.current.rows).toBe(3)
		expect(result.current.cols).toBe(3)
		expect(result.current.sourceImage).toBe('sailboat')
	})

	it('reopens on the choices the player last made', () => {
		const { result } = renderGameConfig(JSON.stringify({ gridSize: 5, sourceImage: 'rocket' }))

		expect(result.current.rows).toBe(5)
		expect(result.current.cols).toBe(5)
		expect(result.current.sourceImage).toBe('rocket')
	})

	it.each([
		['unparseable', '{ not json'],
		['a shape it does not recognise', JSON.stringify({ tiles: 9 })],
		['a size Setup no longer offers', JSON.stringify({ gridSize: 7, sourceImage: 'rocket' })],
		[
			'an artwork the registry no longer has',
			JSON.stringify({ gridSize: 4, sourceImage: 'unicorn' }),
		],
		['a payload that is not an object', JSON.stringify([3, 'sailboat'])],
	])('falls back to the defaults when the stored config is %s', (_case, stored) => {
		const { result } = renderGameConfig(stored)

		expect(result.current.rows).toBe(3)
		expect(result.current.sourceImage).toBe('sailboat')
	})

	it('keeps its own config when another key is corrupt', () => {
		localStorage.setItem(SETTINGS_STORAGE_KEY, '{ not json')
		localStorage.setItem(RECORDS_STORAGE_KEY, 'nonsense')

		const { result } = renderGameConfig(JSON.stringify({ gridSize: 6, sourceImage: 'cat' }))

		expect(result.current.rows).toBe(6)
		expect(result.current.sourceImage).toBe('cat')
	})

	it('remembers a new grid size across a remount', () => {
		const { result, unmount } = renderGameConfig()

		act(() => result.current.setGridSize(4))
		unmount()
		const { result: reopened } = renderGameConfig()

		expect(reopened.current.rows).toBe(4)
		expect(reopened.current.cols).toBe(4)
	})

	it('remembers a new source image across a remount, leaving the size alone', () => {
		const { result, unmount } = renderGameConfig(
			JSON.stringify({ gridSize: 5, sourceImage: 'sailboat' }),
		)

		act(() => result.current.setSourceImage('flower'))
		unmount()
		const { result: reopened } = renderGameConfig()

		expect(reopened.current.sourceImage).toBe('flower')
		expect(reopened.current.rows).toBe(5)
	})
})
