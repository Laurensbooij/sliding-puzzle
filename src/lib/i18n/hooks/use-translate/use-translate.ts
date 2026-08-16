import { useMemo } from 'react'
import { useIntl } from 'react-intl'

import type { MessageValues, TranslationMessage } from '../../types'

/**
 * The imperative half of the facade, for strings that cannot be JSX —
 * `aria-label`, `title`, document titles.
 *
 * Deliberately narrower than react-intl's own API: add a formatter here when a
 * real consumer needs one, so the facade stays smaller than the thing it wraps.
 */
export const useTranslate = () => {
	const intl = useIntl()

	return useMemo(
		() => ({
			translate: (message: TranslationMessage, values?: MessageValues) =>
				intl.formatMessage(message, values),
			formatNumber: intl.formatNumber,
			formatList: intl.formatList,
		}),
		[intl],
	)
}
