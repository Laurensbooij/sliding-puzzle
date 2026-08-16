import en from './locales/en.json'
import nl from './locales/nl.json'
import type { Locale, MessageCatalogue } from './types'

/** Every compiled catalogue, keyed by locale. The single place they are loaded. */
export const CATALOGUES: Record<Locale, MessageCatalogue> = { en, nl }
