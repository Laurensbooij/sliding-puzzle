import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.tsx'],
	addons: [
		'@storybook/addon-docs',
		'@storybook/addon-a11y',
		'@storybook/addon-vitest',
		// Real :hover/:active/:focus-visible in a static frame — Storybook's
		// instrumented events can't produce them, so Chromatic never saw them.
		'storybook-addon-pseudo-states',
	],
	framework: {
		name: '@storybook/react-vite',
		options: {},
	},
}

export default config
