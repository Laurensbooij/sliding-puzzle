import { SUPPORTED_LOCALES } from './constants'
import type { Locale } from './types'

/** Narrows an arbitrary string to a locale we actually ship a catalogue for. */
export const isSupportedLocale = (value: unknown): value is Locale =>
	typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
