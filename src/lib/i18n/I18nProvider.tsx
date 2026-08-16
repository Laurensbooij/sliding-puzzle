import { type FC, type ReactNode, createContext, useMemo, useState } from 'react'
import { IntlProvider } from 'react-intl'

import { CATALOGUES } from './catalogues'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './constants'
import type { Locale } from './types'
import { detectLocale } from './utils/detect-locale'

export interface LocaleContextValue {
	locale: Locale
	setLocale: (locale: Locale) => void
	supportedLocales: readonly Locale[]
}

export const LocaleContext = createContext<LocaleContextValue | null>(null)

export interface I18nProviderProps {
	children: ReactNode
	/**
	 * Starting locale, skipping browser detection. Used by tests and Storybook.
	 * It seeds state rather than pinning it, so a locale switcher still works —
	 * remount (via `key`) to force a different starting locale.
	 */
	initialLocale?: Locale
}

export const I18nProvider: FC<I18nProviderProps> = ({ children, initialLocale }) => {
	const [locale, setLocale] = useState<Locale>(
		() =>
			initialLocale ??
			detectLocale(globalThis.navigator?.languages ?? [globalThis.navigator?.language ?? '']),
	)

	const contextValue = useMemo(
		() => ({ locale, setLocale, supportedLocales: SUPPORTED_LOCALES }),
		[locale],
	)

	return (
		<LocaleContext.Provider value={contextValue}>
			<IntlProvider
				locale={locale}
				defaultLocale={DEFAULT_LOCALE}
				messages={CATALOGUES[locale]}
			>
				{children}
			</IntlProvider>
		</LocaleContext.Provider>
	)
}
