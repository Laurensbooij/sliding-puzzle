import { GAME_CONFIG_STORAGE_KEY } from '@game-config'
import { SETTINGS_STORAGE_KEY } from '@settings'
import { readStorage, renderHookWithProviders, seedStorage } from '@testing'
import { act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RECORDS_STORAGE_KEY } from '../constants'
import { useRecords } from '../use-records'
import { RecordsProvider } from './RecordsProvider'

const renderRecords = (stored?: string) => {
	if (stored !== undefined) localStorage.setItem(RECORDS_STORAGE_KEY, stored)
	return renderHookWithProviders(useRecords, { wrapper: RecordsProvider })
}

const otherHomes = (config: string) => ({
	[GAME_CONFIG_STORAGE_KEY]: config,
	[SETTINGS_STORAGE_KEY]: JSON.stringify({
		referenceImage: false,
		numberedTiles: true,
		showTimer: false,
	}),
})

const VALID_CONFIG = JSON.stringify({ boardSize: 5, sourceImage: 'rocket' })

describe('RecordsProvider', () => {
	it('reports no best at a size the player has never solved', () => {
		const { result } = renderRecords()

		expect(result.current.bestFor(3)).toBeUndefined()
	})

	it('reads the bests the player has already set', () => {
		const { result } = renderRecords(JSON.stringify({ bests: { 3: 40, 5: 300 } }))

		expect(result.current.bestFor(3)).toBe(40)
		expect(result.current.bestFor(5)).toBe(300)
	})

	it.each([
		['unparseable', '{ not json'],
		['a shape it does not recognise', JSON.stringify({ solves: [] })],
		['keyed by a size Setup no longer offers', JSON.stringify({ bests: { 7: 40 } })],
		['holding something that is not a move count', JSON.stringify({ bests: { 3: 'fast' } })],
		['a payload that is not an object', JSON.stringify([40, 300])],
	])('falls back to no records when the stored records are %s', (_case, stored) => {
		const seeded = seedStorage(otherHomes(VALID_CONFIG))

		const { result } = renderRecords(stored)

		expect(result.current.bestFor(3)).toBeUndefined()
		expect(readStorage(Object.keys(seeded))).toEqual(seeded)
	})

	it('leaves the other state homes alone when it has no stored value of its own', () => {
		const seeded = seedStorage(otherHomes(VALID_CONFIG))

		const { result } = renderRecords()

		expect(result.current.bestFor(3)).toBeUndefined()
		expect(readStorage(Object.keys(seeded))).toEqual(seeded)
	})

	it('reads its own key while a neighbouring one is corrupt, and leaves that one as it found it', () => {
		const seeded = seedStorage(otherHomes('{ not json'))

		const { result } = renderRecords(JSON.stringify({ bests: { 4: 120 } }))

		expect(result.current.bestFor(4)).toBe(120)
		expect(readStorage(Object.keys(seeded))).toEqual(seeded)
	})

	it('leaves the other state homes byte-for-byte alone when its own data is rejected and it writes', () => {
		const seeded = seedStorage(otherHomes(VALID_CONFIG))

		const { result } = renderRecords(JSON.stringify({ solves: [] }))
		act(() => result.current.recordSolve({ boardSize: 4, moveCount: 120 }))

		expect(result.current.bestFor(4)).toBe(120)
		expect(readStorage(Object.keys(seeded))).toEqual(seeded)
	})

	it('records a solve and keeps it across a remount', () => {
		const { result, unmount } = renderRecords()

		act(() => result.current.recordSolve({ boardSize: 4, moveCount: 120 }))
		unmount()
		const { result: reopened } = renderRecords()

		expect(reopened.current.bestFor(4)).toBe(120)
	})

	it('reports the new best to every reader as soon as a solve beats it', () => {
		const { result } = renderRecords(JSON.stringify({ bests: { 3: 40 } }))

		act(() => result.current.recordSolve({ boardSize: 3, moveCount: 31 }))

		expect(result.current.bestFor(3)).toBe(31)
	})

	it('leaves the stored best alone when the solve did not beat it', () => {
		const { result } = renderRecords(JSON.stringify({ bests: { 3: 40 } }))

		act(() => result.current.recordSolve({ boardSize: 3, moveCount: 40 }))

		expect(result.current.bestFor(3)).toBe(40)
	})
})
