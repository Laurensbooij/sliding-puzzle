import { RECORDS_STORAGE_KEY } from '@/lib/records'
import { SETTINGS_STORAGE_KEY } from '@/lib/settings'
import { readStorage, renderHookWithProviders, seedStorage } from '@testing'
import { act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GAME_CONFIG_STORAGE_KEY } from '../constants'
import { useGameConfig } from '../use-game-config'
import { GameConfigProvider } from './GameConfigProvider'

const renderGameConfig = (stored?: string) => {
	if (stored !== undefined) localStorage.setItem(GAME_CONFIG_STORAGE_KEY, stored)
	return renderHookWithProviders(useGameConfig, { wrapper: GameConfigProvider })
}

const otherHomes = (settings: string) => ({
	[SETTINGS_STORAGE_KEY]: settings,
	[RECORDS_STORAGE_KEY]: JSON.stringify({ bests: { 4: 120 } }),
})

const VALID_SETTINGS = JSON.stringify({
	referenceImage: false,
	numberedTiles: true,
	showTimer: false,
})

describe('GameConfigProvider', () => {
	it('starts a first-time player on a 3x3 sailboat', () => {
		const { result } = renderGameConfig()

		expect(result.current.rows).toBe(3)
		expect(result.current.cols).toBe(3)
		expect(result.current.sourceImage).toBe('sailboat')
	})

	it('reopens on the choices the player last made', () => {
		const { result } = renderGameConfig(JSON.stringify({ boardSize: 5, sourceImage: 'rocket' }))

		expect(result.current.rows).toBe(5)
		expect(result.current.cols).toBe(5)
		expect(result.current.sourceImage).toBe('rocket')
	})

	it.each([
		['unparseable', '{ not json'],
		['a shape it does not recognise', JSON.stringify({ tiles: 9 })],
		['a size Setup no longer offers', JSON.stringify({ boardSize: 7, sourceImage: 'rocket' })],
		[
			'an artwork the registry no longer has',
			JSON.stringify({ boardSize: 4, sourceImage: 'unicorn' }),
		],
		['a payload that is not an object', JSON.stringify([3, 'sailboat'])],
	])('falls back to the defaults when the stored config is %s', (_case, stored) => {
		const seeded = seedStorage(otherHomes(VALID_SETTINGS))

		const { result } = renderGameConfig(stored)

		expect(result.current.rows).toBe(3)
		expect(result.current.sourceImage).toBe('sailboat')
		expect(readStorage(Object.keys(seeded))).toEqual(seeded)
	})

	it('leaves the other state homes alone when it has no stored value of its own', () => {
		const seeded = seedStorage(otherHomes(VALID_SETTINGS))

		const { result } = renderGameConfig()

		expect(result.current.rows).toBe(3)
		expect(readStorage(Object.keys(seeded))).toEqual(seeded)
	})

	it('reads its own key while a neighbouring one is corrupt, and leaves that one as it found it', () => {
		const seeded = seedStorage(otherHomes('{ not json'))

		const { result } = renderGameConfig(JSON.stringify({ boardSize: 6, sourceImage: 'cat' }))

		expect(result.current.rows).toBe(6)
		expect(result.current.sourceImage).toBe('cat')
		expect(readStorage(Object.keys(seeded))).toEqual(seeded)
	})

	it('leaves the other state homes byte-for-byte alone when its own data is rejected and it writes', () => {
		const seeded = seedStorage(otherHomes(VALID_SETTINGS))

		const { result } = renderGameConfig(JSON.stringify({ tiles: 9 }))
		act(() => result.current.setBoardSize(5))

		expect(result.current.rows).toBe(5)
		expect(readStorage(Object.keys(seeded))).toEqual(seeded)
	})

	it('remembers a new board size across a remount', () => {
		const { result, unmount } = renderGameConfig()

		act(() => result.current.setBoardSize(4))
		unmount()
		const { result: reopened } = renderGameConfig()

		expect(reopened.current.rows).toBe(4)
		expect(reopened.current.cols).toBe(4)
	})

	it('remembers a new source image across a remount, leaving the size alone', () => {
		const { result, unmount } = renderGameConfig(
			JSON.stringify({ boardSize: 5, sourceImage: 'sailboat' }),
		)

		act(() => result.current.setSourceImage('flower'))
		unmount()
		const { result: reopened } = renderGameConfig()

		expect(reopened.current.sourceImage).toBe('flower')
		expect(reopened.current.rows).toBe(5)
	})
})
