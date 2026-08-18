import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		projects: [
			{
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
				plugins: [react()],
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
				plugins: [storybookTest({ configDir: '.storybook' })],
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
