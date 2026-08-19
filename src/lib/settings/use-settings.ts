import { useContext } from 'react'

import { SettingsContext, type SettingsContextValue } from './SettingsProvider/SettingsProvider'

/** Reads and changes the player's display preferences. Throws outside `<SettingsProvider>`. */
export const useSettings = (): SettingsContextValue => {
	const context = useContext(SettingsContext)
	if (!context) throw new Error('useSettings must be used inside <SettingsProvider>')
	return context
}
