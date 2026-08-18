import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import svgr from 'vite-plugin-svgr'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		projects: [
			{
				// The source-image catalogue imports its SVGs as components, so
				// even the DOM-less project needs the transform.
				plugins: [svgr()],
				resolve: { tsconfigPaths: true },
				// `.spec.ts` means no DOM: engine rules, catalogues, lint rules, hooks.
				test: {
					name: 'node',
					environment: 'node',
					include: [
						'src/**/*.spec.ts',
						'tools/**/*.spec.mjs',
						'.claude/hooks/**/*.spec.mjs',
					],
				},
			},
			{
				plugins: [react(), svgr()],
				resolve: { tsconfigPaths: true },
				test: {
					name: 'components',
					environment: 'jsdom',
					include: ['src/**/*.spec.tsx'],
					setupFiles: ['./vitest.setup.ts'],
				},
			},
			{
				// Real-browser axe scan of every story — the a11y gate stack's
				// story-scan layer (docs/conventions/accessibility.md, SLI-18).
				// Vitest projects don't inherit the root vite config, so the SVG
				// transform has to be named here too.
				plugins: [storybookTest({ configDir: '.storybook' }), svgr()],
				resolve: { tsconfigPaths: true },
				test: {
					name: 'storybook',
					browser: {
						enabled: true,
						provider: playwright(),
						headless: true,
						instances: [{ browser: 'chromium' }],
					},
				},
			},
		],
		coverage: {
			provider: 'v8',
			include: ['src/**'],
			exclude: ['src/**/*.stories.tsx', 'src/main.tsx'],
		},
	},
})
