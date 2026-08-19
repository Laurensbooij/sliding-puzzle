import { RECORDS_STORAGE_KEY, RecordsProvider, useRecords } from '@/lib/records'
import type { Records } from '@/lib/records'
import { createBoard } from '@engine'
import { readStorage, renderHookWithProviders, seedStorage } from '@testing'
import type { RenderHookResult } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useRecordedSolve } from './use-recorded-solve'
import type { RecordedSolveInput } from './use-recorded-solve'

interface HookResult {
	isNewBest: boolean
	best: number | undefined
}

/**
 * The game on screen, as the Play screen would hand it over. Mutable because
 * the hook takes plain values: only a re-render can give it new ones, and a
 * case moves them between renders exactly as a played move would.
 */
let onScreen: RecordedSolveInput

interface SolveCase extends Partial<RecordedSolveInput> {
	/** Seeded into the records key, the way a returning player's browser holds it. */
	bests?: Records['bests']
}

const renderRecordedSolve = ({
	bests = {},
	solved = true,
	board = createBoard(3, 3),
	boardSize = 3,
	moveCount = 42,
}: SolveCase = {}): RenderHookResult<HookResult, unknown> => {
	onScreen = { solved, board, boardSize, moveCount }
	seedStorage({ [RECORDS_STORAGE_KEY]: JSON.stringify({ bests } satisfies Records) })

	// The stored best comes back through the provider rather than through
	// storage, so a case reads what the screen beside this hook would read.
	return renderHookWithProviders(
		() => ({
			isNewBest: useRecordedSolve(onScreen),
			best: useRecords().bestFor(onScreen.boardSize),
		}),
		{ wrapper: RecordsProvider },
	)
}

const storedBests = (): Records['bests'] => {
	const stored = readStorage([RECORDS_STORAGE_KEY])[RECORDS_STORAGE_KEY]
	if (!stored) throw new Error('The records key holds nothing')
	return (JSON.parse(stored) as Records).bests
}

beforeEach(() => {
	onScreen = { solved: false, board: createBoard(3, 3), boardSize: 3, moveCount: 0 }
})

describe('useRecordedSolve', () => {
	it('writes the solve on screen into the records', () => {
		const { result } = renderRecordedSolve({ moveCount: 42 })

		expect(result.current.best).toBe(42)
	})

	it('records nothing while the game is still being played', () => {
		const { result } = renderRecordedSolve({ solved: false, moveCount: 42 })

		expect(result.current.best).toBeUndefined()
	})

	/**
	 * The whole reason the solved board is the identity of a solve: the screen
	 * re-renders on every tick of its clock and on the write this hook itself
	 * causes, and none of those is a second win.
	 */
	it('records one solve once, however often its caller renders again', () => {
		const { result, rerender } = renderRecordedSolve({ moveCount: 42 })

		onScreen = { ...onScreen, moveCount: 7 }
		rerender()

		expect(result.current.best).toBe(42)
	})

	it('records the next game too, once a new board is solved', () => {
		const { result, rerender } = renderRecordedSolve({ moveCount: 42 })

		onScreen = { ...onScreen, board: createBoard(3, 3), moveCount: 30 }
		rerender()

		expect(result.current.best).toBe(30)
	})

	describe('a new best', () => {
		it('is the first solve at a size, having nothing to beat', () => {
			const { result } = renderRecordedSolve({ bests: {}, moveCount: 42 })

			expect(result.current.isNewBest).toBe(true)
		})

		it('is strictly fewer moves than the stored best', () => {
			const { result } = renderRecordedSolve({ bests: { 3: 42 }, moveCount: 41 })

			expect(result.current.isNewBest).toBe(true)
			expect(storedBests()).toEqual({ 3: 41 })
		})

		it('is not a tie', () => {
			const { result } = renderRecordedSolve({ bests: { 3: 42 }, moveCount: 42 })

			expect(result.current.isNewBest).toBe(false)
			expect(storedBests()).toEqual({ 3: 42 })
		})

		it('is not a worse game', () => {
			const { result } = renderRecordedSolve({ bests: { 3: 42 }, moveCount: 43 })

			expect(result.current.isNewBest).toBe(false)
			expect(storedBests()).toEqual({ 3: 42 })
		})

		/**
		 * Read before the write, not after: the records already hold this solve
		 * by the time it lands, so comparing afterwards would call every solve a
		 * best.
		 */
		it('survives the re-render the write itself causes', () => {
			const { result, rerender } = renderRecordedSolve({ bests: {}, moveCount: 42 })

			rerender()

			expect(result.current.isNewBest).toBe(true)
		})

		it('belongs to the solve that set it, not to the game after it', () => {
			const { result, rerender } = renderRecordedSolve({ bests: {}, moveCount: 42 })

			onScreen = { ...onScreen, solved: false, board: createBoard(3, 3), moveCount: 3 }
			rerender()

			expect(result.current.isNewBest).toBe(false)
		})

		it('is never claimed by a game still in progress', () => {
			const { result } = renderRecordedSolve({ solved: false })

			expect(result.current.isNewBest).toBe(false)
		})
	})

	it('keeps every other size the player has a best at', () => {
		renderRecordedSolve({ bests: { 3: 42, 5: 180 }, boardSize: 3, moveCount: 30 })

		expect(storedBests()).toEqual({ 3: 30, 5: 180 })
	})
})
