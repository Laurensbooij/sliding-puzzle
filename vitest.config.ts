import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		projects: [
			{
				// Engine rules + lint-rule specs: pure functions, no DOM (ADR-0001).
				test: {
					name: 'engine',
					environment: 'node',
					include: ['src/engine/**/*.spec.ts', 'tools/**/*.spec.mjs'],
				},
			},
			{
				plugins: [react()],
				test: {
					name: 'components',
					environment: 'jsdom',
					include: ['src/**/*.spec.tsx'],
					setupFiles: ['./vitest.setup.ts'],
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
