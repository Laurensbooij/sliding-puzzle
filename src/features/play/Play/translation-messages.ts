import { defineMessages } from '@i18n'

export const playMessages = defineMessages({
	heading: {
		id: 'play.heading',
		defaultMessage: 'Play',
		description:
			'Heading of the Play screen. Visually hidden — the design draws no heading — and what a screen reader announces on arrival',
	},
	movesLabel: {
		id: 'play.stats.moves.label',
		defaultMessage: 'Moves',
		description: 'Label of the read-out counting the tiles relocated so far. Shown in capitals',
	},
	timeLabel: {
		id: 'play.stats.time.label',
		defaultMessage: 'Time',
		description:
			'Label of the read-out showing how long this game has been running. Shown in capitals',
	},
	bestLabel: {
		id: 'play.stats.best.label',
		defaultMessage: 'Best',
		description:
			'Label of the read-out showing the fewest moves this board size has been solved in. Shown in capitals',
	},
	bestUnset: {
		id: 'play.stats.best.unset',
		defaultMessage: '—',
		description:
			'Value of the Best read-out while nothing has been solved at this board size yet. An em dash',
	},
	boardSizeLabel: {
		id: 'play.stats.board-size.label',
		defaultMessage: 'Grid',
		description:
			'Label of the read-out showing the board dimensions. Shown in capitals. "Grid" is the players’ word for it — the code calls it a board',
	},
	boardSizeValue: {
		id: 'play.stats.board-size.value',
		defaultMessage: '{rows}×{cols}',
		description:
			'Board dimensions as the player reads them, e.g. 3×3. The separator is a multiplication sign, not the letter x',
	},
	abandonTitle: {
		id: 'play.abandon.title',
		defaultMessage: 'Abandon this game?',
		description:
			'Title of the confirmation shown when the player asks to leave a game in progress',
	},
	abandonDescription: {
		id: 'play.abandon.description',
		defaultMessage: 'Your moves and time are lost, and nothing is recorded.',
		description: 'Supporting line of the abandon confirmation, spelling out what is destroyed',
	},
	abandonConfirm: {
		id: 'play.abandon.confirm',
		defaultMessage: 'Abandon',
		description:
			'Destructive action of the abandon confirmation. Ends the game and returns to the Setup screen',
	},
	restartTitle: {
		id: 'play.restart.title',
		defaultMessage: 'Restart this game?',
		description:
			'Title of the confirmation shown when the player asks for a fresh shuffle mid-game',
	},
	restartDescription: {
		id: 'play.restart.description',
		defaultMessage:
			'You get a fresh shuffle at the same size. Your moves and time so far are lost.',
		description: 'Supporting line of the restart confirmation, spelling out what is destroyed',
	},
	restartConfirm: {
		id: 'play.restart.confirm',
		defaultMessage: 'Restart',
		description: 'Destructive action of the restart confirmation. Deals a new game',
	},
	keepPlaying: {
		id: 'play.keep-playing',
		defaultMessage: 'Keep playing',
		description:
			'Action that backs out of either confirmation, leaving the game exactly as it was',
	},
})
