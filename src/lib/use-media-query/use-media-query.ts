import { useCallback, useSyncExternalStore } from 'react'

/**
 * The one number that decides desktop, generated from `tokens/manual/` into
 * `src/styles/tokens.css`. Read at runtime rather than restated in TypeScript
 * so CSS and JS cannot drift (ADR-0016).
 */
const DESKTOP_BREAKPOINT_PROPERTY = '--breakpoint-desktop'

/**
 * Subscribes to a media query, re-rendering when it starts or stops matching.
 *
 * Mobile-first by construction: pass a `min-width` query, and `false` — the
 * value before any listener fires, and the value when the token is missing — is
 * the mobile branch. Desktop is what has to be opted into.
 */
export const useMediaQuery = (query: string): boolean => {
	const subscribe = useCallback(
		(onChange: () => void) => {
			const mediaQueryList = window.matchMedia(query)
			mediaQueryList.addEventListener('change', onChange)
			return () => {
				mediaQueryList.removeEventListener('change', onChange)
			}
		},
		[query],
	)

	// Read through `matchMedia` rather than cached in state: the store is the
	// browser's, and useSyncExternalStore is what keeps a render from tearing
	// against it.
	const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])

	return useSyncExternalStore(subscribe, getSnapshot)
}

/**
 * True from `--breakpoint-desktop` upward, false below it.
 *
 * A missing token yields an invalid query, which never matches — so a stylesheet
 * that failed to load degrades to the mobile layout rather than to a layout
 * built for a width nobody has.
 */
export const useIsDesktop = (): boolean => {
	const breakpoint = getComputedStyle(document.documentElement)
		.getPropertyValue(DESKTOP_BREAKPOINT_PROPERTY)
		.trim()

	return useMediaQuery(`(min-width: ${breakpoint})`)
}
