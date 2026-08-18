import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.tsx'],
	addons: [
		'@storybook/addon-docs',
		'@storybook/addon-a11y',
		'@storybook/addon-vitest',
		// Forces :hover/:active/:focus-visible over CDP. Synthetic events cannot
		// drive CSS pseudo-classes, so designed interaction states would
		// otherwise be unrenderable — and invisible to axe and Chromatic.
		'storybook-addon-pseudo-states',
	],
	framework: {
		name: '@storybook/react-vite',
		options: {},
	},
}

export default config
