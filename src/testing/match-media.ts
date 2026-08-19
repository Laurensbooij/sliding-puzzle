/** Both spellings a MediaQueryList accepts: the event-target form and the deprecated one. */
type ChangeListener = EventListenerOrEventListenerObject | ((event: MediaQueryListEvent) => unknown)

interface MediaQueryState {
	matches: boolean
	listeners: Set<ChangeListener>
}

/** One state per query string, so every `matchMedia(query)` call sees the same list. */
const statesByQuery = new Map<string, MediaQueryState>()

const stateFor = (query: string): MediaQueryState => {
	const existing = statesByQuery.get(query)
	if (existing) return existing

	// Mobile-first: an unset `min-width` query starts unmatched, the same
	// starting point a narrow viewport gives the real thing.
	const created: MediaQueryState = { matches: false, listeners: new Set() }
	statesByQuery.set(query, created)
	return created
}

const notify = (listener: ChangeListener, event: MediaQueryListEvent): void => {
	if (typeof listener === 'function') listener(event)
	else listener.handleEvent(event)
}

const createMediaQueryList = (query: string): MediaQueryList => {
	const state = stateFor(query)

	return {
		media: query,
		get matches() {
			return state.matches
		},
		onchange: null,
		addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
			state.listeners.add(listener)
		},
		removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
			state.listeners.delete(listener)
		},
		// Superseded by addEventListener in every browser, kept because the
		// MediaQueryList type still declares them.
		addListener: (listener: ChangeListener | null) => {
			if (listener) state.listeners.add(listener)
		},
		removeListener: (listener: ChangeListener | null) => {
			if (listener) state.listeners.delete(listener)
		},
		dispatchEvent: () => true,
	}
}

/**
 * jsdom ships no `matchMedia` at all — not a stub, not a no-op — so the first
 * render of anything that subscribes to a media query throws. This fake
 * restores the observable contract and adds the one thing a spec needs that a
 * real viewport gives for free: control over whether a query matches, and a way
 * to cross a breakpoint mid-test.
 *
 * Deliberately thin, like the popover and dialog shims beside it in
 * vitest.setup.ts. It parses nothing: a query string is an opaque key, so
 * `(min-width: 48rem)` and `(min-width: 768px)` are two unrelated queries here
 * even though a browser evaluates them alike. A spec asserts that the *right*
 * query reaches `matchMedia`; whether a browser reads that query the way we
 * expect is a Chromium question.
 */
export const installMatchMedia = (): void => {
	window.matchMedia = createMediaQueryList
}

/** Drops every query's state and listeners. Runs between tests. */
export const resetMatchMedia = (): void => {
	statesByQuery.clear()
}

/** Sets whether a query matches and notifies its subscribers, as a resize would. */
export const setMediaQueryMatches = (query: string, matches: boolean): void => {
	const state = stateFor(query)
	if (state.matches === matches) return

	state.matches = matches
	const event = Object.assign(new Event('change'), { matches, media: query })
	for (const listener of state.listeners) notify(listener, event)
}

/**
 * How many subscribers a query still holds. A leaked subscription is invisible
 * from the outside — nothing throws, the listener just outlives its component —
 * so a spec has to count.
 */
export const mediaQueryListenerCount = (query: string): number => stateFor(query).listeners.size
