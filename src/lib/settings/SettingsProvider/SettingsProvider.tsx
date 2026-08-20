import { usePersistedState } from '@/lib/storage'
import { type Locale, detectLocale } from '@i18n'
import { type FC, type ReactNode, createContext, useCallback, useMemo, useState } from 'react'

import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '../constants'
import { isSettings } from '../guards'
import type { Settings } from '../types'

export interface SettingsContextValue extends Settings {
	setReferenceImage: (referenceImage: boolean) => void
	setNumberedTiles: (numberedTiles: boolean) => void
	setShowTimer: (showTimer: boolean) => void
	setLocale: (locale: Locale) => void
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)

export interface SettingsProviderProps {
	children: ReactNode
}

/**
 * Holds the player's display preferences and their chosen language. Nothing
 * about the timer itself lives here — `showTimer` says whether to render one,
 * and the Play feature owns the tick.
 *
 * The language is stored rather than detected per load, so browser detection
 * seeds the fallback only: once a player has chosen, the choice outranks their
 * browser for good. Detection runs at mount rather than in `DEFAULT_SETTINGS`
 * because a module constant that reads `navigator` is non-deterministic for
 * everything that imports it.
 */
export const SettingsProvider: FC<SettingsProviderProps> = ({ children }) => {
	const [fallback] = useState<Settings>(() => ({
		...DEFAULT_SETTINGS,
		locale: detectLocale(
			globalThis.navigator?.languages ?? [globalThis.navigator?.language ?? ''],
		),
	}))

	const [settings, setSettings] = usePersistedState(SETTINGS_STORAGE_KEY, isSettings, fallback)

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

	const setLocale = useCallback(
		(locale: Locale) => setSettings((previous) => ({ ...previous, locale })),
		[setSettings],
	)

	const contextValue = useMemo(
		() => ({ ...settings, setReferenceImage, setNumberedTiles, setShowTimer, setLocale }),
		[settings, setReferenceImage, setNumberedTiles, setShowTimer, setLocale],
	)

	return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>
}
