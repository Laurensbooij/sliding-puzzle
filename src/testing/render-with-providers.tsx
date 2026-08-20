import { I18nProvider, type Locale } from '@i18n'
import { type RenderOptions, type RenderResult, render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

import { AppStateProviders, type RenderProviders } from './app-state-providers'

export type { RenderProviders }

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
	/** Renders under a specific locale. Defaults to English. */
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
		<I18nProvider initialLocale={locale}>
			<AppStateProviders providers={providers}>{children}</AppStateProviders>
		</I18nProvider>
	)

	return render(ui, { wrapper: Providers, ...options })
}
