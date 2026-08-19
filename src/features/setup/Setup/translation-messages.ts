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
	previewLabel: {
		id: 'setup.preview.label',
		defaultMessage: 'The solved picture at {size}×{size}',
		description:
			'Accessible name of the board on Setup, which shows the chosen artwork solved; {size} is the board dimension',
	},
	boardSizeLabel: {
		id: 'setup.board-size.label',
		defaultMessage: 'Grid size',
		description:
			'Caption and accessible name of the board-size control, drawn uppercase as GRID SIZE',
	},
	boardSizeOption: {
		id: 'setup.board-size.option',
		defaultMessage: '{size} × {size}',
		description: 'One board-size option, e.g. 3 × 3; {size} is the board dimension',
	},
	recordEmpty: {
		id: 'setup.record.empty',
		defaultMessage: 'No record at {size}×{size} yet',
		description:
			'Line beside the start button when the player has never solved this board size; {size} is the board dimension',
	},
	recordBest: {
		id: 'setup.record.best',
		defaultMessage:
			'Your record at {size}×{size}: {moves, plural, one {# move} other {# moves}}',
		description:
			'Line beside the start button showing the fewest moves the player has solved this board size in; {size} is the board dimension',
	},
	start: {
		id: 'setup.start',
		defaultMessage: 'Start puzzle',
		description: 'Label of the button that leaves Setup and starts a game',
	},
})
