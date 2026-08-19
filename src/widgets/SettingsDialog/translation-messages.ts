import { defineMessages } from '@i18n'

export const settingsDialogMessages = defineMessages({
	title: {
		id: 'settings-dialog.title',
		defaultMessage: 'Settings',
		description: 'Heading of the settings dialog, and the accessible name of the dialog',
	},
	referenceImageLabel: {
		id: 'settings-dialog.reference-image.label',
		defaultMessage: 'Reference image',
		description: 'Label of the switch that shows the solved picture beside the board',
	},
	referenceImageDescription: {
		id: 'settings-dialog.reference-image.description',
		defaultMessage: 'Shows the solved picture beside the board',
		description: 'Supporting line under the Reference image switch, saying what it does',
	},
	numberedTilesLabel: {
		id: 'settings-dialog.numbered-tiles.label',
		defaultMessage: 'Numbered tiles',
		description: 'Label of the switch that draws each tile’s solved position on the tile',
	},
	numberedTilesDescription: {
		id: 'settings-dialog.numbered-tiles.description',
		defaultMessage: 'Shows each tile’s solved position',
		description: 'Supporting line under the Numbered tiles switch, saying what it does',
	},
	showTimerLabel: {
		id: 'settings-dialog.show-timer.label',
		defaultMessage: 'Show timer',
		description:
			'Label of the switch that shows the running clock while playing. The design gives this one no supporting line',
	},
})
