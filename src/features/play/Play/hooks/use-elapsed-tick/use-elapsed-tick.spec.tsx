import { renderHookWithProviders } from '@testing'
import type { RenderHookResult } from '@testing-library/react'
import { act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useElapsedTick } from './use-elapsed-tick'

const SECOND_MS = 1000

/** Mounting is itself a render; every case counts from there. */
const RENDERS_ON_MOUNT = 1

/**
 * The hook returns nothing — the re-render it forces is its whole surface — so
 * the spec counts renders in this counter rather than reading a return value.
 */
let committedRenders = 0

/**
 * `active` is a getter where a case has to flip it between renders: the hook
 * takes a plain boolean, and only a re-render can hand it a new one.
 */
const renderElapsedTick = (active: boolean | (() => boolean)): RenderHookResult<void, unknown> => {
	committedRenders = 0

	return renderHookWithProviders(() => {
		committedRenders += 1
		useElapsedTick(typeof active === 'function' ? active() : active)
	})
}

const advance = (ms: number) =>
	act(() => {
		vi.advanceTimersByTime(ms)
	})

beforeEach(() => {
	vi.useFakeTimers()
})

afterEach(() => {
	vi.useRealTimers()
})

describe('useElapsedTick', () => {
	// A second at a time, not three at once: React batches everything inside one
	// `act`, so a single three-second jump would land as one re-render and prove
	// nothing about the beat.
	it('renders its caller again once a second while it is active', () => {
		renderElapsedTick(true)

		advance(SECOND_MS)
		advance(SECOND_MS)
		advance(SECOND_MS)

		expect(committedRenders).toBe(RENDERS_ON_MOUNT + 3)
	})

	it('renders nothing on its own while it is inactive', () => {
		renderElapsedTick(false)

		advance(5 * SECOND_MS)

		expect(committedRenders).toBe(RENDERS_ON_MOUNT)
	})

	it('schedules nothing at all while it is inactive', () => {
		renderElapsedTick(false)

		expect(vi.getTimerCount()).toBe(0)
	})

	it('stops ticking the moment it goes inactive', () => {
		let active = true
		renderElapsedTick(() => active)

		// Mount, the tick a second in, then the tick that re-renders with the flag
		// already down — which is the render whose effect clears the interval.
		advance(SECOND_MS)
		active = false
		advance(SECOND_MS)
		advance(5 * SECOND_MS)

		expect(committedRenders).toBe(RENDERS_ON_MOUNT + 2)
		expect(vi.getTimerCount()).toBe(0)
	})

	it('drops its interval on unmount', () => {
		const view = renderElapsedTick(true)

		view.unmount()

		expect(vi.getTimerCount()).toBe(0)
	})
})
