import { Message } from '@i18n'
import { globalMessages } from '@messages'
import type { FC } from 'react'

export const App: FC = () => (
	<main>
		<h1>
			<Message message={globalMessages.appName} />
		</h1>
	</main>
)
