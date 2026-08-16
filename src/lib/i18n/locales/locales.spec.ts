import { describe, expect, it } from 'vitest'

import { CATALOGUES } from '../catalogues'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../constants'

/**
 * react-intl silently falls back to `defaultMessage` when a key is missing, so
 * a forgotten Dutch translation ships English text inside the Dutch UI with no
 * error anywhere. These assertions are the only thing that catches it.
 */
describe('locale catalogues', () => {
	const defaultKeys = Object.keys(CATALOGUES[DEFAULT_LOCALE] ?? {}).sort()

	it('has a catalogue for every supported locale', () => {
		const cataloguedLocales = Object.keys(CATALOGUES).sort()
		expect(cataloguedLocales).toEqual([...SUPPORTED_LOCALES].sort())
	})

	it.each(SUPPORTED_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE))(
		'translates every %s key that %s has',
		(locale) => {
			const localeKeys = Object.keys(CATALOGUES[locale] ?? {}).sort()
			expect(localeKeys).toEqual(defaultKeys)
		},
	)

	it.each(SUPPORTED_LOCALES)('has no empty messages in %s', (locale) => {
		const blankKeys = Object.entries(CATALOGUES[locale] ?? {})
			.filter(([, message]) => message.trim() === '')
			.map(([key]) => key)
		expect(blankKeys).toEqual([])
	})
})
