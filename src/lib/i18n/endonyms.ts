import type { Locale } from './types'

/**
 * Each locale's name in its own language. Never translated: a player who lands
 * in a language they cannot read still has to recognise their way out of it.
 * Static data rather than messages for the same reason — there is nothing here
 * for a catalogue to vary.
 *
 * Its own module, not `constants.ts`: `types.ts` reads `SUPPORTED_LOCALES`, so
 * a `Locale` import there would close a cycle.
 */
export const LOCALE_ENDONYMS: Record<Locale, string> = {
	en: 'English',
	nl: 'Nederlands',
}
