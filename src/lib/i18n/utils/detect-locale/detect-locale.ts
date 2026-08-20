import { DEFAULT_LOCALE } from '../../constants'
import { isSupportedLocale } from '../../guards'
import type { Locale } from '../../types'

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
