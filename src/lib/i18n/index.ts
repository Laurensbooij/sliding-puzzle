export { I18nProvider } from './I18nProvider'
export type { I18nProviderProps } from './I18nProvider'
export { Message } from './Message'
export { useTranslate } from './hooks/use-translate/use-translate'
export { createTranslate } from './utils/create-translate'
export { detectLocale } from './utils/detect-locale/detect-locale'
export { isSupportedLocale } from './guards'
export { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './constants'
export { LOCALE_ENDONYMS } from './endonyms'
export type { Locale, MessageCatalogue, MessageValues, TranslationMessage } from './types'

// Re-exported so `translation-messages.ts` files never import react-intl
// directly. Verified: @formatjs/cli matches the `defineMessages` callee name,
// not its import source, so extraction still finds messages declared this way.
export { defineMessages } from 'react-intl'
