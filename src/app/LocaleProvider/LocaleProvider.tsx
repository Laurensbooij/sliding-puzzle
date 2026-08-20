import { I18nProvider } from '@i18n'
import { useSettings } from '@settings'
import type { FC, ReactNode } from 'react'
import { useEffect } from 'react'

export interface LocaleProviderProps {
	children: ReactNode
}

/**
 * Decides which language the app is in, and tells the document about it.
 *
 * Paired with `I18nProvider`, which it renders: this one *chooses* the locale —
 * from the player's stored setting — and that one is what the choice is handed
 * to. Reach for `useSettings()` to read the current locale; neither of these is
 * a context of its own.
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
export const LocaleProvider: FC<LocaleProviderProps> = ({ children }) => {
	const { locale } = useSettings()

	useEffect(() => {
		document.documentElement.lang = locale
	}, [locale])

	return <I18nProvider locale={locale}>{children}</I18nProvider>
}
