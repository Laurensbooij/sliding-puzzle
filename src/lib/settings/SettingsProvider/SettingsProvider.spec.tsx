import { GAME_CONFIG_STORAGE_KEY } from '@/lib/game-config'
import { RECORDS_STORAGE_KEY } from '@/lib/records'
import { readStorage, renderHookWithProviders, seedStorage } from '@testing'
import { act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SETTINGS_STORAGE_KEY } from '../constants'
import { useSettings } from '../use-settings'
import { SettingsProvider } from './SettingsProvider'

const renderSettings = (stored?: string) => {
	if (stored !== undefined) localStorage.setItem(SETTINGS_STORAGE_KEY, stored)
	return renderHookWithProviders(useSettings, { wrapper: SettingsProvider })
}

const otherHomes = (config: string) => ({
	[GAME_CONFIG_STORAGE_KEY]: config,
	[RECORDS_STORAGE_KEY]: JSON.stringify({ bests: { 4: 120 } }),
})

const VALID_CONFIG = JSON.stringify({ boardSize: 5, sourceImage: 'rocket' })

const storedSettings = { referenceImage: false, numberedTiles: true, showTimer: false }

describe('SettingsProvider', () => {
	it('starts a first-time player with the reference image on, numbers off and the timer on', () => {
		const { result } = renderSettings()

		expect(result.current.referenceImage).toBe(true)
		expect(result.current.numberedTiles).toBe(false)
		expect(result.current.showTimer).toBe(true)
	})

	it('reopens on the preferences the player last set', () => {
		const { result } = renderSettings(JSON.stringify(storedSettings))

		expect(result.current.referenceImage).toBe(false)
		expect(result.current.numberedTiles).toBe(true)
		expect(result.current.showTimer).toBe(false)
	})

	it.each([
		['unparseable', '{ not json'],
		['a shape it does not recognise', JSON.stringify({ theme: 'dark' })],
		['missing a preference', JSON.stringify({ referenceImage: false, showTimer: false })],
		['holding the wrong type', JSON.stringify({ ...storedSettings, showTimer: 'yes' })],
		['a payload that is not an object', JSON.stringify([false, true, false])],
	])('falls back to the defaults when the stored settings are %s', (_case, stored) => {
		const seeded = seedStorage(otherHomes(VALID_CONFIG))

		const { result } = renderSettings(stored)

		expect(result.current.referenceImage).toBe(true)
		expect(result.current.numberedTiles).toBe(false)
		expect(result.current.showTimer).toBe(true)
		expect(readStorage(Object.keys(seeded))).toEqual(seeded)
	})

	it('leaves the other state homes alone when it has no stored value of its own', () => {
		const seeded = seedStorage(otherHomes(VALID_CONFIG))

		const { result } = renderSettings()

		expect(result.current.referenceImage).toBe(true)
		expect(readStorage(Object.keys(seeded))).toEqual(seeded)
	})

	it('reads its own key while a neighbouring one is corrupt, and leaves that one as it found it', () => {
		const seeded = seedStorage(otherHomes('{ not json'))

		const { result } = renderSettings(JSON.stringify(storedSettings))

		expect(result.current.numberedTiles).toBe(true)
		expect(result.current.showTimer).toBe(false)
		expect(readStorage(Object.keys(seeded))).toEqual(seeded)
	})

	it('leaves the other state homes byte-for-byte alone when its own data is rejected and it writes', () => {
		const seeded = seedStorage(otherHomes(VALID_CONFIG))

		const { result } = renderSettings(JSON.stringify({ theme: 'dark' }))
		act(() => result.current.setNumberedTiles(true))

		expect(result.current.numberedTiles).toBe(true)
		expect(readStorage(Object.keys(seeded))).toEqual(seeded)
	})

	it('remembers each preference across a remount, leaving the others alone', () => {
		const { result, unmount } = renderSettings()

		act(() => result.current.setNumberedTiles(true))
		act(() => result.current.setShowTimer(false))
		unmount()
		const { result: reopened } = renderSettings()

		expect(reopened.current.numberedTiles).toBe(true)
		expect(reopened.current.showTimer).toBe(false)
		expect(reopened.current.referenceImage).toBe(true)
	})

	it('remembers the reference image being turned off', () => {
		const { result, unmount } = renderSettings()

		act(() => result.current.setReferenceImage(false))
		unmount()
		const { result: reopened } = renderSettings()

		expect(reopened.current.referenceImage).toBe(false)
	})
})
