import { usePersistedState } from '@/lib/storage'
import { type FC, type ReactNode, createContext, useCallback, useMemo } from 'react'

import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '../constants'
import { isSettings } from '../guards'
import type { Settings } from '../types'

export interface SettingsContextValue extends Settings {
	setReferenceImage: (referenceImage: boolean) => void
	setNumberedTiles: (numberedTiles: boolean) => void
	setShowTimer: (showTimer: boolean) => void
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)

export interface SettingsProviderProps {
	children: ReactNode
}

/**
 * Holds the player's display preferences. Nothing about the timer itself lives
 * here — `showTimer` says whether to render one, and the Play feature owns the
 * tick.
 */
export const SettingsProvider: FC<SettingsProviderProps> = ({ children }) => {
	const [settings, setSettings] = usePersistedState(
		SETTINGS_STORAGE_KEY,
		isSettings,
		DEFAULT_SETTINGS,
	)

	const setReferenceImage = useCallback(
		(referenceImage: boolean) => setSettings((previous) => ({ ...previous, referenceImage })),
		[setSettings],
	)

	const setNumberedTiles = useCallback(
		(numberedTiles: boolean) => setSettings((previous) => ({ ...previous, numberedTiles })),
		[setSettings],
	)

	const setShowTimer = useCallback(
		(showTimer: boolean) => setSettings((previous) => ({ ...previous, showTimer })),
		[setSettings],
	)

	const contextValue = useMemo(
		() => ({ ...settings, setReferenceImage, setNumberedTiles, setShowTimer }),
		[settings, setReferenceImage, setNumberedTiles, setShowTimer],
	)

	return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>
}
