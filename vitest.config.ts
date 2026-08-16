import react from '@vitejs/plugin-react'
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
		],
		coverage: {
			provider: 'v8',
			include: ['src/**'],
			exclude: ['src/**/*.stories.tsx', 'src/main.tsx'],
		},
	},
})
