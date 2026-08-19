import { defineMessages } from '@i18n'

export const setupMessages = defineMessages({
	heading: {
		id: 'setup.heading',
		defaultMessage: 'Eight tiles, one gap.',
		description:
			'Tagline heading of the Setup screen. Fixed copy — it is not derived from the chosen board size',
	},
	lede: {
		id: 'setup.lede',
		defaultMessage:
			'Slide the glass pieces back into order. Fewer moves is better — there is no timer unless you want one.',
		description: 'Paragraph under the Setup heading, explaining the game in one line',
	},
	start: {
		id: 'setup.start',
		defaultMessage: 'Start puzzle',
		description: 'Label of the button that leaves Setup and starts a game',
	},
})
