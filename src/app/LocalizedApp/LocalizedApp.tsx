import { I18nProvider } from '@i18n'
import { useSettings } from '@settings'
import type { FC, ReactNode } from 'react'
import { useEffect } from 'react'

export interface LocalizedAppProps {
	children: ReactNode
}

/**
 * Feeds the player's stored language to `I18nProvider`, and tells the document
 * which language it is now in.
 *
 * The join has to happen in a component because `I18nProvider` is controlled:
 * `@settings` imports `Locale` from `@i18n`, so the provider reading
 * `useSettings()` directly would close a module cycle. The app tier is where
 * wiring like this belongs (ADR-0017's spirit) and the only place that sees
 * both providers.
 *
 * `<html lang>` is set here rather than in `I18nProvider` for the same reason
 * `useDocumentTitle` sits in this tier: there is one document, and only the app
 * knows it is the whole app. `index.html` ships `lang="en"`, so without this a
 * screen reader reads Dutch with English phonemes (WCAG 3.1.1).
 */
export const LocalizedApp: FC<LocalizedAppProps> = ({ children }) => {
	const { locale } = useSettings()

	useEffect(() => {
		document.documentElement.lang = locale
	}, [locale])

	return <I18nProvider locale={locale}>{children}</I18nProvider>
}
