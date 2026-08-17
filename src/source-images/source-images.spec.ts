import { describe, expect, it } from 'vitest'

import { SOURCE_IMAGES, SOURCE_IMAGE_NAMES } from './index'

/**
 * The registry is the only sanctioned way to reach an artwork: a missing file
 * must surface here (and as a type error), never as a 404 in the app.
 */
describe('source-image registry', () => {
	it('registers exactly the six designed artworks', () => {
		const registeredNames = Object.keys(SOURCE_IMAGES).sort()
		expect(registeredNames).toEqual([...SOURCE_IMAGE_NAMES].sort())
	})

	// Vite serves an asset as a hashed .svg URL, or inlines it as a data: URI
	// when it is under assetsInlineLimit — both come from the same pipeline.
	it.each([...SOURCE_IMAGE_NAMES])('resolves %s to an svg asset URL', (name) => {
		const assetUrl = SOURCE_IMAGES[name]
		expect(assetUrl).toMatch(/^data:image\/svg\+xml|\.svg$/)
	})
})
