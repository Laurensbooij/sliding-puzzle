import type { SUPPORTED_LOCALES } from './constants'

export type Locale = (typeof SUPPORTED_LOCALES)[number]

/** A message descriptor as produced by `defineMessages`. */
export interface TranslationMessage {
	id: string
	defaultMessage: string
	description?: string
}

/** The shape of a compiled locale catalogue: message id → translated string. */
export type MessageCatalogue = Record<string, string>

/** Interpolation values for a message's ICU placeholders. */
export type MessageValues = Record<string, string | number>
