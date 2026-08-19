import { defineMessages } from '@i18n'

export const artworkChoiceMessages = defineMessages({
	legend: {
		id: 'setup.artwork.label',
		defaultMessage: 'Artwork',
		description:
			'Caption above the six artwork swatches on the Setup screen, drawn uppercase; also the accessible name of the group',
	},
})

/**
 * One name per source image, keyed by its registry name so the component can
 * look a name up by the artwork it is drawing. Adding an artwork without a name
 * is a type error at that lookup, which is the point of keying it this way.
 *
 * Named for what the player sees, not for the file: `bike.svg` draws a bicycle
 * and `coffee.svg` draws a cup.
 */
export const artworkNameMessages = defineMessages({
	sailboat: {
		id: 'setup.artwork.sailboat',
		defaultMessage: 'Sailboat',
		description: 'Accessible name of the artwork swatch drawing a sailboat',
	},
	rocket: {
		id: 'setup.artwork.rocket',
		defaultMessage: 'Rocket',
		description: 'Accessible name of the artwork swatch drawing a rocket',
	},
	bike: {
		id: 'setup.artwork.bike',
		defaultMessage: 'Bicycle',
		description: 'Accessible name of the artwork swatch drawing a bicycle',
	},
	coffee: {
		id: 'setup.artwork.coffee',
		defaultMessage: 'Coffee cup',
		description: 'Accessible name of the artwork swatch drawing a cup of coffee',
	},
	cat: {
		id: 'setup.artwork.cat',
		defaultMessage: 'Cat',
		description: "Accessible name of the artwork swatch drawing a cat's face",
	},
	flower: {
		id: 'setup.artwork.flower',
		defaultMessage: 'Flower',
		description: 'Accessible name of the artwork swatch drawing a flower',
	},
})
