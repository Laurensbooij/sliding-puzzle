import { mediaQueryListenerCount, setMediaQueryMatches } from '@testing'
import { type RenderHookResult, act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useIsDesktop, useMediaQuery } from './use-media-query'

const DESKTOP_BREAKPOINT = '48rem'
const DESKTOP_QUERY = `(min-width: ${DESKTOP_BREAKPOINT})`

const renderUseMediaQuery = (query: string): RenderHookResult<boolean, void> =>
	renderHook(() => useMediaQuery(query))

const renderUseIsDesktop = (breakpoint: string | null): RenderHookResult<boolean, void> => {
	// The real token arrives from tokens.css, which jsdom never loads — so the
	// spec plays stylesheet and puts the same custom property on :root.
	if (breakpoint !== null)
		document.documentElement.style.setProperty('--breakpoint-desktop', breakpoint)

	return renderHook(() => useIsDesktop())
}

afterEach(() => {
	document.documentElement.style.removeProperty('--breakpoint-desktop')
})

describe('useMediaQuery', () => {
	it('reports the mobile branch while the query does not match', () => {
		const { result } = renderUseMediaQuery(DESKTOP_QUERY)

		expect(result.current).toBe(false)
	})

	it('reports the desktop branch when the query already matches on mount', () => {
		setMediaQueryMatches(DESKTOP_QUERY, true)
		const { result } = renderUseMediaQuery(DESKTOP_QUERY)

		expect(result.current).toBe(true)
	})

	it('follows the query across the breakpoint in both directions', () => {
		const { result } = renderUseMediaQuery(DESKTOP_QUERY)

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
		const { unmount } = renderUseMediaQuery(DESKTOP_QUERY)
		const subscribedCount = mediaQueryListenerCount(DESKTOP_QUERY)

		unmount()
		const remainingCount = mediaQueryListenerCount(DESKTOP_QUERY)

		expect(subscribedCount).toBe(1)
		expect(remainingCount).toBe(0)
	})

	it('moves its subscription to the new query when the query changes', () => {
		const narrowQuery = '(min-width: 20rem)'
		const { rerender } = renderHook(({ query }) => useMediaQuery(query), {
			initialProps: { query: narrowQuery },
		})

		rerender({ query: DESKTOP_QUERY })
		const narrowCount = mediaQueryListenerCount(narrowQuery)
		const desktopCount = mediaQueryListenerCount(DESKTOP_QUERY)

		expect(narrowCount).toBe(0)
		expect(desktopCount).toBe(1)
	})
})

describe('useIsDesktop', () => {
	it('asks for the width the --breakpoint-desktop token names', () => {
		const { result } = renderUseIsDesktop(DESKTOP_BREAKPOINT)

		act(() => {
			setMediaQueryMatches(DESKTOP_QUERY, true)
		})

		expect(result.current).toBe(true)
	})

	it('stays on the mobile branch when the token is missing', () => {
		const { result } = renderUseIsDesktop(null)

		expect(result.current).toBe(false)
	})
})
