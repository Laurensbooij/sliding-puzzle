import { defineMessages } from '@i18n'

/**
 * Copy for the temporary Setup screen. It ships to the catalogues like any
 * other message so the no-literal-string rule stays honest; SLI-63 deletes
 * these entries along with the screen.
 */
export const placeholderMessages = defineMessages({
	setupHeading: {
		id: 'placeholder.setup.heading',
		defaultMessage: 'Set up your game',
		description: 'Heading of the temporary Setup placeholder screen',
	},
	toPlay: {
		id: 'placeholder.link.play',
		defaultMessage: 'Start playing',
		description: 'Link from the Setup placeholder to the Play screen',
	},
})
