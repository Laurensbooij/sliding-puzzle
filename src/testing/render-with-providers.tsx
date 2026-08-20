import { I18nProvider, type Locale } from '@i18n'
import { type RenderOptions, type RenderResult, render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

import { AppStateProviders, type RenderProviders } from './app-state-providers'

export type { RenderProviders }

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
	/**
	 * Which catalogue renders. Defaults to English.
	 *
	 * This drives `I18nProvider` only — it does not seed the stored `locale`
	 * setting. A spec that cares what the language picker *displays* seeds
	 * `SETTINGS_STORAGE_KEY` itself, the same way it seeds any other setting.
	 */
	locale?: Locale
	/** The app state providers the component under test reads from. Each defaults to off. */
	providers?: RenderProviders
}

/**
 * Renders a component inside the app's real providers, using the real message
 * catalogues rather than mocks — so a test that queries by accessible name is
 * checking the same string a user would hear.
 *
 * **i18n is the floor, app state is opt-in.** `I18nProvider` is unconditional:
 * every spec queries by accessible name against the real catalogues (ADR-0005).
 * The three state providers are flags, because opting in is how a spec declares
 * which context the component under test depends on.
 */
export const renderWithProviders = (
	ui: ReactElement,
	{ locale = 'en', providers = {}, ...options }: RenderWithProvidersOptions = {},
): RenderResult => {
	const Providers = ({ children }: { children: ReactNode }) => (
		<I18nProvider locale={locale}>
			<AppStateProviders providers={providers}>{children}</AppStateProviders>
		</I18nProvider>
	)

	return render(ui, { wrapper: Providers, ...options })
}
