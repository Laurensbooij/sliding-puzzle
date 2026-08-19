import { mediaQueryListenerCount, renderHookWithProviders, setMediaQueryMatches } from '@testing'
import { type RenderHookResult, act } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useIsDesktop, useMediaQuery } from './use-media-query'

const DESKTOP_BREAKPOINT = '48rem'
const DESKTOP_QUERY = `(min-width: ${DESKTOP_BREAKPOINT})`
const NARROW_QUERY = '(min-width: 20rem)'

/** A getter rather than a string where a case has to change the query and re-render. */
const renderMediaQuery = (query: string | (() => string)): RenderHookResult<boolean, unknown> =>
	renderHookWithProviders(() => useMediaQuery(typeof query === 'function' ? query() : query))

const renderIsDesktop = (breakpoint: string | null): RenderHookResult<boolean, unknown> => {
	// The real token arrives from tokens.css, which jsdom never loads — so the
	// spec plays stylesheet and puts the same custom property on :root.
	if (breakpoint !== null)
		document.documentElement.style.setProperty('--breakpoint-desktop', breakpoint)

	return renderHookWithProviders(useIsDesktop)
}

afterEach(() => {
	document.documentElement.style.removeProperty('--breakpoint-desktop')
})

describe('useMediaQuery', () => {
	it('reports the mobile branch while the query does not match', () => {
		const { result } = renderMediaQuery(DESKTOP_QUERY)

		expect(result.current).toBe(false)
	})

	it('reports the desktop branch when the query already matches on mount', () => {
		setMediaQueryMatches(DESKTOP_QUERY, true)
		const { result } = renderMediaQuery(DESKTOP_QUERY)

		expect(result.current).toBe(true)
	})

	it('follows the query across the breakpoint in both directions', () => {
		const { result } = renderMediaQuery(DESKTOP_QUERY)

		act(() => {
			setMediaQueryMatches(DESKTOP_QUERY, true)
		})
		expect(result.current).toBe(true)

		act(() => {
			setMediaQueryMatches(DESKTOP_QUERY, false)
		})
		expect(result.current).toBe(false)
	})

	it('drops its subscription on unmount', () => {
		const { unmount } = renderMediaQuery(DESKTOP_QUERY)
		const subscribedCount = mediaQueryListenerCount(DESKTOP_QUERY)

		unmount()
		const remainingCount = mediaQueryListenerCount(DESKTOP_QUERY)

		expect(subscribedCount).toBe(1)
		expect(remainingCount).toBe(0)
	})

	it('moves its subscription to the new query when the query changes', () => {
		let query = NARROW_QUERY
		const { rerender } = renderMediaQuery(() => query)

		query = DESKTOP_QUERY
		rerender()
		const narrowCount = mediaQueryListenerCount(NARROW_QUERY)
		const desktopCount = mediaQueryListenerCount(DESKTOP_QUERY)

		expect(narrowCount).toBe(0)
		expect(desktopCount).toBe(1)
	})
})

describe('useIsDesktop', () => {
	it('asks for the width the --breakpoint-desktop token names', () => {
		const { result } = renderIsDesktop(DESKTOP_BREAKPOINT)

		act(() => {
			setMediaQueryMatches(DESKTOP_QUERY, true)
		})

		expect(result.current).toBe(true)
	})

	it('stays on the mobile branch when the token is missing', () => {
		const { result } = renderIsDesktop(null)

		expect(result.current).toBe(false)
	})
})
