import { describe, expect, it } from 'vitest'

import { DEFAULT_LOCALE } from '../constants'
import type { Locale } from '../types'
import { detectLocale } from './detect-locale'

describe('detectLocale', () => {
	it.each<[readonly string[], Locale]>([
		[['nl'], 'nl'],
		[['en'], 'en'],
		// Region subtags resolve to their base language.
		[['nl-BE'], 'nl'],
		[['en-GB'], 'en'],
		// The first *translatable* language wins, not simply the first.
		[['fr', 'de', 'nl'], 'nl'],
		[['nl', 'en'], 'nl'],
	])('resolves %j to %s', (languages, expected) => {
		const detected = detectLocale(languages)
		expect(detected).toBe(expected)
	})

	it.each<[readonly string[]]>([[[]], [['fr']], [['de-AT', 'es']], [['']]])(
		'falls back to the default for %j',
		(languages) => {
			const detected = detectLocale(languages)
			expect(detected).toBe(DEFAULT_LOCALE)
		},
	)
})
