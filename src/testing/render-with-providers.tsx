import { I18nProvider, type Locale } from '@i18n'
import { type RenderOptions, type RenderResult, render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
	/** Renders under a specific locale. Defaults to English. */
	locale?: Locale
}

/**
 * Renders a component inside the app's real providers, using the real message
 * catalogues rather than mocks — so a test that queries by accessible name is
 * checking the same string a user would hear.
 */
export const renderWithProviders = (
	ui: ReactElement,
	{ locale = 'en', ...options }: RenderWithProvidersOptions = {},
): RenderResult => {
	const Providers = ({ children }: { children: ReactNode }) => (
		<I18nProvider initialLocale={locale}>{children}</I18nProvider>
	)

	return render(ui, { wrapper: Providers, ...options })
}
