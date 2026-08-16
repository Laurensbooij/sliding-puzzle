import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Aliases come from tsconfig so TypeScript, Vite, Vitest and Storybook all
// resolve them from one declaration. See ADR-0007.
export default defineConfig({
	plugins: [react()],
	resolve: { tsconfigPaths: true },
})
