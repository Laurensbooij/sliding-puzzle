import { defineMessages } from '@i18n'

export const setupControlsMessages = defineMessages({
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
})
