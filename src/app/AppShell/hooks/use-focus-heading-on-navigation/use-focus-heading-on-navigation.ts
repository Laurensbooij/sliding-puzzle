import { type RefObject, useEffect, useRef } from 'react'
import { useLocation } from 'react-router'

/**
 * Moves focus to the new screen's `<h1>` after an in-app navigation, and
 * returns the ref to put on the element the screens render inside.
 *
 * A full page load moves a screen reader to the top of the new document. An SPA
 * route change moves nothing: the old screen is gone but the reading cursor and
 * the tab position are still where it used to be. Landing on the heading
 * restores both, and reads the new screen's name out loud on the way.
 *
 * First paint is deliberately excluded — nothing navigated, and taking focus off
 * the document start on load is its own bug. The previous pathname is tracked in
 * a ref rather than an "is first render" flag so StrictMode's double-invoked
 * effect cannot mistake the mount for a navigation.
 */
export const useFocusHeadingOnNavigation = (): RefObject<HTMLElement | null> => {
	const pageContentRef = useRef<HTMLElement>(null)
	const { pathname } = useLocation()
	const previousPathname = useRef(pathname)

	useEffect(() => {
		if (previousPathname.current === pathname) return
		previousPathname.current = pathname

		const heading = pageContentRef.current?.querySelector('h1')
		if (!heading) return

		// A heading is not focusable on its own, and must not become a tab stop:
		// -1 makes it programmatically focusable and nothing more.
		heading.tabIndex = -1
		heading.focus()
	}, [pathname])

	return pageContentRef
}
