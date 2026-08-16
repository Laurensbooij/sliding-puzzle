import { createIntl } from 'react-intl'

import { CATALOGUES } from '../catalogues'
import { DEFAULT_LOCALE } from '../constants'
import type { Locale, MessageValues, TranslationMessage } from '../types'

/**
 * The formatter outside React, for callers with no component to hook into —
 * chiefly tests building an expected value from the same message the component
 * renders. Mirrors `useTranslate`'s surface.
 */
export const createTranslate = (locale: Locale = DEFAULT_LOCALE) => {
	const intl = createIntl({
		locale,
		defaultLocale: DEFAULT_LOCALE,
		messages: CATALOGUES[locale],
	})

	return {
		translate: (message: TranslationMessage, values?: MessageValues) =>
			intl.formatMessage(message, values),
		formatNumber: intl.formatNumber,
		formatList: intl.formatList,
	}
}
