import { ROUTES } from '@/lib/routes'
import { Message } from '@i18n'
import type { FC } from 'react'
import { Link } from 'react-router'

import { placeholderMessages } from './translation-messages'

/**
 * TEMPORARY — SLI-55 replaces this with the real Play screen and deletes this
 * file. It exists so the router has something to mount: a route table with no
 * screens behind it cannot be tested end to end.
 */
export const PlayPlaceholder: FC = () => (
	<>
		<h1>
			<Message message={placeholderMessages.playHeading} />
		</h1>
		<Link to={ROUTES.setup}>
			<Message message={placeholderMessages.toSetup} />
		</Link>
	</>
)
