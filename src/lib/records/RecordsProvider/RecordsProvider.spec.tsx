import { GAME_CONFIG_STORAGE_KEY } from '@/lib/game-config'
import { SETTINGS_STORAGE_KEY } from '@/lib/settings'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RECORDS_STORAGE_KEY } from '../constants'
import { useRecords } from '../use-records'
import { RecordsProvider } from './RecordsProvider'

const renderRecords = (stored?: string) => {
	if (stored !== undefined) localStorage.setItem(RECORDS_STORAGE_KEY, stored)
	return renderHook(() => useRecords(), { wrapper: RecordsProvider })
}

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
		const { result } = renderRecords(stored)

		expect(result.current.bestFor(3)).toBeUndefined()
	})

	it('keeps its own records when another key is corrupt', () => {
		localStorage.setItem(GAME_CONFIG_STORAGE_KEY, '{ not json')
		localStorage.setItem(SETTINGS_STORAGE_KEY, 'nonsense')

		const { result } = renderRecords(JSON.stringify({ bests: { 4: 120 } }))

		expect(result.current.bestFor(4)).toBe(120)
	})

	it('records a solve and keeps it across a remount', () => {
		const { result, unmount } = renderRecords()

		act(() => result.current.recordSolve({ gridSize: 4, moveCount: 120 }))
		unmount()
		const { result: reopened } = renderRecords()

		expect(reopened.current.bestFor(4)).toBe(120)
	})

	it('reports the new best to every reader as soon as a solve beats it', () => {
		const { result } = renderRecords(JSON.stringify({ bests: { 3: 40 } }))

		act(() => result.current.recordSolve({ gridSize: 3, moveCount: 31 }))

		expect(result.current.bestFor(3)).toBe(31)
	})

	it('leaves the stored best alone when the solve did not beat it', () => {
		const { result } = renderRecords(JSON.stringify({ bests: { 3: 40 } }))

		act(() => result.current.recordSolve({ gridSize: 3, moveCount: 40 }))

		expect(result.current.bestFor(3)).toBe(40)
	})
})
