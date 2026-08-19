import { I18nProvider, type Locale } from '@i18n'
import { type RenderHookResult, renderHook } from '@testing-library/react'
import type { FC, ReactNode } from 'react'

export interface RenderHookWithProvidersOptions {
	/** Renders under a specific locale. Defaults to English. */
	locale?: Locale
	/** The provider the hook reads from, mounted inside the app's own providers. */
	wrapper?: FC<{ children: ReactNode }>
}

/**
 * The hook-spec counterpart of `renderWithProviders`: same real providers, same
 * real message catalogues, no component in between. A hook whose whole surface
 * is its return value is read through this rather than through a probe
 * component built to display it.
 */
export const renderHookWithProviders = <Result,>(
	hook: () => Result,
	{ locale = 'en', wrapper: ProviderUnderTest }: RenderHookWithProvidersOptions = {},
): RenderHookResult<Result, unknown> => {
	const Providers = ({ children }: { children: ReactNode }) => (
		<I18nProvider initialLocale={locale}>
			{ProviderUnderTest ? <ProviderUnderTest>{children}</ProviderUnderTest> : children}
		</I18nProvider>
	)

	return renderHook(hook, { wrapper: Providers })
}
