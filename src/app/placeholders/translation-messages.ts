import { defineMessages } from '@i18n'

/**
 * Copy for the temporary screens below. It ships to the catalogues like any
 * other message so the no-literal-string rule stays honest; SLI-55 and SLI-63
 * delete these entries along with the screens.
 */
export const placeholderMessages = defineMessages({
	setupHeading: {
		id: 'placeholder.setup.heading',
		defaultMessage: 'Set up your game',
		description: 'Heading of the temporary Setup placeholder screen',
	},
	playHeading: {
		id: 'placeholder.play.heading',
		defaultMessage: 'Play',
		description: 'Heading of the temporary Play placeholder screen',
	},
	toPlay: {
		id: 'placeholder.link.play',
		defaultMessage: 'Start playing',
		description: 'Link from the Setup placeholder to the Play screen',
	},
	toSetup: {
		id: 'placeholder.link.setup',
		defaultMessage: 'Back to setup',
		description: 'Link from the Play placeholder back to the Setup screen',
	},
})
