import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { SOURCE_IMAGES, SOURCE_IMAGE_NAMES } from './index'

const VECTORS_DIR = join(import.meta.dirname, 'vectors')

/**
 * The registry is the only sanctioned way to reach a source image: a missing
 * file must surface here (and as a type error), never as a 404 in the app.
 */
describe('source-image registry', () => {
	it('registers exactly the six designed source images', () => {
		const registeredNames = Object.keys(SOURCE_IMAGES).sort()
		expect(registeredNames).toEqual([...SOURCE_IMAGE_NAMES].sort())
	})

	it.each([...SOURCE_IMAGE_NAMES])('resolves %s to a component, not a URL', (name) => {
		const SourceImage = SOURCE_IMAGES[name]
		expect(SourceImage).toBeTypeOf('function')
	})

	/**
	 * The ink belongs to whoever renders the image, not to the file. A baked hex
	 * would silently win over the consumer's `color`, and the two-tone treatment
	 * the design system's art/ink pair implies would be impossible.
	 */
	it.each(readdirSync(VECTORS_DIR))('paints %s in currentColor, never a literal', (fileName) => {
		const markup = readFileSync(join(VECTORS_DIR, fileName), 'utf8')
		const paints = [...markup.matchAll(/(?:fill|stroke)="([^"]*)"/g)].map(
			([, paint]) => paint ?? '',
		)

		expect(paints).not.toHaveLength(0)
		expect(paints.filter((paint) => paint !== 'none')).toEqual(
			expect.arrayContaining(['currentColor']),
		)
		expect(paints.some((paint) => paint.startsWith('#'))).toBe(false)
	})
})
