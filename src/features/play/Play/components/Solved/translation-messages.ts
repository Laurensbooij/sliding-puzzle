import { defineMessages } from '@i18n'

export const solvedMessages = defineMessages({
	title: {
		id: 'play.solved.title',
		defaultMessage: 'Solved in {count, plural, one {# move} other {# moves}}',
		description:
			'Title of the card shown once the board is solved; {count} is how many tiles were relocated over the whole game',
	},
	description: {
		id: 'play.solved.description',
		defaultMessage: 'Finished in {time}.',
		description:
			'Supporting line under the title; {time} is the elapsed time as mm:ss, e.g. 01:18',
	},
	playAgain: {
		id: 'play.solved.play-again',
		defaultMessage: 'Play again',
		description: 'Action that deals a new board at the size just solved',
	},
	tryNextSize: {
		id: 'play.solved.try-next-size',
		defaultMessage: 'Try {size} × {size}',
		description:
			'Action that starts a game one board size up; {size} is that size, e.g. 4 for a 4×4 board',
	},
})
