import type { FC, ReactNode } from 'react'
import { IntlProvider } from 'react-intl'

import { CATALOGUES } from './catalogues'
import { DEFAULT_LOCALE } from './constants'
import type { Locale } from './types'

export interface I18nProviderProps {
	children: ReactNode
	/** The locale to render in. Owned by the caller — see the note below. */
	locale: Locale
}

/**
 * Renders its subtree in one locale.
 *
 * **Controlled, deliberately.** The locale is a stored player setting, so it
 * lives in `@settings` and this provider is handed the value. It cannot read
 * `useSettings()` itself: `@settings` imports `Locale` from here, and the
 * return trip would close a cycle that `import-x/no-cycle` rejects. `src/app/`
 * does the wiring; tests and Storybook pass the prop directly.
 *
 * `<html lang>` is deliberately *not* set here. There is one document and there
 * may be many of these — a spec harness nests one inside another — so the last
 * effect to run would win an argument no provider can see. The app tier owns
 * document-level state, next to `useDocumentTitle`.
 */
export const I18nProvider: FC<I18nProviderProps> = ({ children, locale }) => (
	<IntlProvider locale={locale} defaultLocale={DEFAULT_LOCALE} messages={CATALOGUES[locale]}>
		{children}
	</IntlProvider>
)
