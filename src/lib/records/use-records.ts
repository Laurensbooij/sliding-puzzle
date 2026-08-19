import { useContext } from 'react'

import { RecordsContext, type RecordsContextValue } from './RecordsProvider/RecordsProvider'

/** Reads and adds to the player's records. Throws outside `<RecordsProvider>`. */
export const useRecords = (): RecordsContextValue => {
	const context = useContext(RecordsContext)
	if (!context) throw new Error('useRecords must be used inside <RecordsProvider>')
	return context
}
