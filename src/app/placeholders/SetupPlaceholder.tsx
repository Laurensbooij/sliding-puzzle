import { ROUTES } from '@/lib/routes'
import { Message } from '@i18n'
import type { FC } from 'react'
import { Link } from 'react-router'

import { placeholderMessages } from './translation-messages'

/**
 * TEMPORARY — SLI-63 replaces this with the real Setup screen and deletes this
 * file. It exists so the router has something to mount: a route table with no
 * screens behind it cannot be tested end to end.
 */
export const SetupPlaceholder: FC = () => (
	<>
		<h1>
			<Message message={placeholderMessages.setupHeading} />
		</h1>
		<Link to={ROUTES.play}>
			<Message message={placeholderMessages.toPlay} />
		</Link>
	</>
)
