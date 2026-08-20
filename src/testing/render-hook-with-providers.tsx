import { I18nProvider, type Locale } from '@i18n'
import { type RenderHookResult, renderHook } from '@testing-library/react'
import type { FC, ReactNode } from 'react'

import { AppStateProviders, type RenderProviders } from './app-state-providers'

export interface RenderHookWithProvidersOptions {
	/** Renders under a specific locale. Defaults to English. */
	locale?: Locale
	/** The app state providers the hook reads from. Each defaults to off. */
	providers?: RenderProviders
	/** A provider that is not one of the app's three — the escape hatch for a provider's own spec. */
	wrapper?: FC<{ children: ReactNode }>
}

/**
 * The hook-spec counterpart of `renderWithProviders`: same real providers, same
 * real message catalogues, no component in between. A hook whose whole surface
 * is its return value is read through this rather than through a probe
 * component built to display it.
 *
 * **i18n is the floor, app state is opt-in** — same asymmetry as
 * `renderWithProviders`, for the same reason.
 */
export const renderHookWithProviders = <Result,>(
	hook: () => Result,
	{
		locale = 'en',
		providers = {},
		wrapper: ProviderUnderTest,
	}: RenderHookWithProvidersOptions = {},
): RenderHookResult<Result, unknown> => {
	const Providers = ({ children }: { children: ReactNode }) => (
		<I18nProvider initialLocale={locale}>
			<AppStateProviders providers={providers}>
				{ProviderUnderTest ? <ProviderUnderTest>{children}</ProviderUnderTest> : children}
			</AppStateProviders>
		</I18nProvider>
	)

	return renderHook(hook, { wrapper: Providers })
}
