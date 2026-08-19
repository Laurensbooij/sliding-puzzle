import { defineMessages } from '@i18n'

export const leaveConfirmationMessages = defineMessages({
	title: {
		id: 'leave-confirmation.title',
		defaultMessage: 'Leave this game?',
		description:
			'Title of the confirmation shown when navigation would take the player away from a game in progress',
	},
	description: {
		id: 'leave-confirmation.description',
		defaultMessage:
			'Your game is not finished. Leaving now abandons it — your moves and time are lost.',
		description:
			'Supporting line of the leave confirmation, spelling out that leaving abandons the game',
	},
	leave: {
		id: 'leave-confirmation.leave',
		defaultMessage: 'Leave',
		description:
			'Destructive action of the leave confirmation. Lets the navigation through, which abandons the game',
	},
})
