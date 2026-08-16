import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../constants'
import type { Locale } from '../types'

const isSupportedLocale = (value: string): value is Locale =>
	(SUPPORTED_LOCALES as readonly string[]).includes(value)

/**
 * Picks the first browser language we actually translate, falling back to the
 * default. Matches on the base tag so `nl-BE` resolves to `nl`.
 */
export const detectLocale = (languages: readonly string[]): Locale => {
	for (const language of languages) {
		const [base] = language.split('-')
		if (base && isSupportedLocale(base)) return base
	}
	return DEFAULT_LOCALE
}
