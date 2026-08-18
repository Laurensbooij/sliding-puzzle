import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.tsx'],
	addons: [
		'@storybook/addon-docs',
		'@storybook/addon-a11y',
		'@storybook/addon-vitest',
		// Forces :hover/:active/:focus-visible for stories: real interaction
		// events from play functions are synthetic and never match CSS pseudo
		// -classes, so pointer-transient states would otherwise be untestable.
		'storybook-addon-pseudo-states',
	],
	framework: {
		name: '@storybook/react-vite',
		options: {},
	},
}

export default config
