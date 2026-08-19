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
	keepPlaying: {
		id: 'common.keep-playing',
		defaultMessage: 'Keep playing',
		description:
			'Action that backs out of a confirmation raised over a game in progress, leaving the game exactly as it was',
	},
	close: {
		id: 'common.close',
		defaultMessage: 'Close',
		description:
			'Accessible name and tooltip of a control that dismisses the surface it sits in; the icon is a cross',
	},
})
