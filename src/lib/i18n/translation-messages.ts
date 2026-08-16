import { defineMessages } from './index'

/**
 * Messages reusable across the whole app, reached via `@messages`.
 *
 * Promotion rule is the same as everywhere else: a string used by one component
 * stays in that component's own `translation-messages.ts` and only moves here
 * when a second consumer appears.
 */
export const globalMessages = defineMessages({
	appName: {
		id: 'app.name',
		defaultMessage: 'Sliding Puzzle',
		description: 'The name of the application',
	},
})
