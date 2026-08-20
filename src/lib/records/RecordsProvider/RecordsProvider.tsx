import { usePersistedState } from '@/lib/storage'
import type { BoardSize } from '@game-config'
import { type FC, type ReactNode, createContext, useCallback, useMemo } from 'react'

import { applySolve } from '../apply-solve/apply-solve'
import { EMPTY_RECORDS, RECORDS_STORAGE_KEY } from '../constants'
import { isRecords } from '../guards'
import type { Solve } from '../types'

export interface RecordsContextValue {
	bestFor: (boardSize: BoardSize) => number | undefined
	recordSolve: (solve: Solve) => void
}

export const RecordsContext = createContext<RecordsContextValue | null>(null)

export interface RecordsProviderProps {
	children: ReactNode
}

/**
 * Holds the player's bests. A provider rather than a bare hook because records
 * has readers in three places at once — the BEST card, the solved dialog and
 * the Setup screen — and independent hooks would each keep a copy that drifts
 * the moment one of them records a solve.
 *
 * Deciding that a solve happened is not this module's job: the Play feature
 * watches the machine reach `solved` and calls `recordSolve`.
 */
export const RecordsProvider: FC<RecordsProviderProps> = ({ children }) => {
	const [records, setRecords] = usePersistedState(RECORDS_STORAGE_KEY, isRecords, EMPTY_RECORDS)

	const bestFor = useCallback((boardSize: BoardSize) => records.bests[boardSize], [records])

	const recordSolve = useCallback(
		(solve: Solve) => setRecords((previous) => applySolve(previous, solve)),
		[setRecords],
	)

	const contextValue = useMemo(() => ({ bestFor, recordSolve }), [bestFor, recordSolve])

	return <RecordsContext.Provider value={contextValue}>{children}</RecordsContext.Provider>
}
