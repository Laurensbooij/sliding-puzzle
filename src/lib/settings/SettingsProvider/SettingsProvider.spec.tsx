import { GAME_CONFIG_STORAGE_KEY } from '@/lib/game-config'
import { RECORDS_STORAGE_KEY } from '@/lib/records'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SETTINGS_STORAGE_KEY } from '../constants'
import { useSettings } from '../use-settings'
import { SettingsProvider } from './SettingsProvider'

const renderSettings = (stored?: string) => {
	if (stored !== undefined) localStorage.setItem(SETTINGS_STORAGE_KEY, stored)
	return renderHook(() => useSettings(), { wrapper: SettingsProvider })
}

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
		const { result } = renderSettings(stored)

		expect(result.current.referenceImage).toBe(true)
		expect(result.current.numberedTiles).toBe(false)
		expect(result.current.showTimer).toBe(true)
	})

	it('keeps its own preferences when another key is corrupt', () => {
		localStorage.setItem(GAME_CONFIG_STORAGE_KEY, '{ not json')
		localStorage.setItem(RECORDS_STORAGE_KEY, 'nonsense')

		const { result } = renderSettings(JSON.stringify(storedSettings))

		expect(result.current.referenceImage).toBe(false)
		expect(result.current.numberedTiles).toBe(true)
		expect(result.current.showTimer).toBe(false)
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
