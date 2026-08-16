import type { FC } from 'react'
import { FormattedMessage } from 'react-intl'

import type { MessageValues, TranslationMessage } from './types'

export interface MessageProps {
	message: TranslationMessage
	values?: MessageValues
}

/** Renders a translated message. The declarative half of the facade. */
export const Message: FC<MessageProps> = ({ message, values }) => (
	<FormattedMessage {...message} values={values} />
)
