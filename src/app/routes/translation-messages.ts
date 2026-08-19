import { defineMessages } from '@i18n'

/**
 * Per-route document titles. They live with the route table rather than with a
 * screen: the title describes where the player is, which is the route's fact,
 * and the placeholder screens below are temporary.
 */
export const routeMessages = defineMessages({
	setupTitle: {
		id: 'route.setup.title',
		defaultMessage: 'Sliding Puzzle',
		description: 'Document title of the Setup screen, which is the app entry point',
	},
	playTitle: {
		id: 'route.play.title',
		defaultMessage: 'Playing · Sliding Puzzle',
		description: 'Document title while a game is on screen',
	},
})
