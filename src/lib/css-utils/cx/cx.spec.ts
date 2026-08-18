import { describe, expect, it } from 'vitest'

import { cx } from './cx'

describe('cx', () => {
	it('joins the truthy class names with a single space', () => {
		const className = cx('badge', 'accent')
		expect(className).toBe('badge accent')
	})

	it.each<false | null | undefined | ''>([undefined, false, null, ''])('drops %j', (falsy) => {
		const className = cx('badge', falsy, 'accent')
		expect(className).toBe('badge accent')
	})

	it('returns undefined when nothing is left', () => {
		const className = cx(undefined, false)
		expect(className).toBeUndefined()
	})
})
