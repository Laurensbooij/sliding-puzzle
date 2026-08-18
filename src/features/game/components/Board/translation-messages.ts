import { defineMessages } from '@i18n'

export const boardMessages = defineMessages({
	label: {
		id: 'board.label',
		defaultMessage: 'Board, {rows} by {cols}',
		description: 'Accessible name of the board; {rows} and {cols} are its dimensions',
	},
	moveAnnouncement: {
		id: 'board.move-announcement',
		defaultMessage:
			'{direction, select, up {{count, plural, one {# tile moved up} other {# tiles moved up}}} down {{count, plural, one {# tile moved down} other {# tiles moved down}}} left {{count, plural, one {# tile moved left} other {# tiles moved left}}} other {{count, plural, one {# tile moved right} other {# tiles moved right}}}}',
		description:
			'Announced after every move; {count} tiles all travelled {direction}. One full sentence per variant so the verb and adverb can be inflected together',
	},
})
