import { defineMessages } from '@i18n'

/**
 * Copy for the temporary screen below. It ships to the catalogues like any
 * other message so the no-literal-string rule stays honest; SLI-55 deletes
 * these entries along with the screen.
 */
export const placeholderMessages = defineMessages({
	playHeading: {
		id: 'placeholder.play.heading',
		defaultMessage: 'Play',
		description: 'Heading of the temporary Play placeholder screen',
	},
	toSetup: {
		id: 'placeholder.link.setup',
		defaultMessage: 'Back to setup',
		description: 'Link from the Play placeholder back to the Setup screen',
	},
})
