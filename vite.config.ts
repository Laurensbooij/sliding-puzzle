import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'

// Aliases come from tsconfig so TypeScript, Vite, Vitest and Storybook all
// resolve them from one declaration. See ADR-0007.
export default defineConfig({
	// Source images are imported as components (`?react`) so their
	// `currentColor` strokes take the consumer's ink token.
	plugins: [react(), svgr()],
	resolve: { tsconfigPaths: true },
})
