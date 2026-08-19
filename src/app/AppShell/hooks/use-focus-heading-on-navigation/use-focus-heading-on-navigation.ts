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
 * The first committed location is excluded — nothing navigated, and taking focus
 * off the document start on load is its own bug. One load does move focus: an
 * unknown URL, where the fallback route redirects to Setup and the pathname
 * changes before anyone has interacted. That is left alone deliberately, because
 * the heading is exactly where someone who mistyped a URL should land.
 *
 * The previous pathname is tracked in a ref rather than an "is first render"
 * flag so StrictMode's double-invoked effect cannot mistake the mount for a
 * navigation.
 *
 * @param headingClassName - class the shell styles its focus ring on; applied
 *   to the heading here because the heading is the screen's markup, not ours.
 */
export const useFocusHeadingOnNavigation = (
	headingClassName: string | undefined,
): RefObject<HTMLElement | null> => {
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
		// A CSS-module lookup is `string | undefined` under
		// `noUncheckedIndexedAccess`, and a missing class costs the ring, not the
		// focus move — so the guard fails soft rather than throwing on `add('')`.
		if (headingClassName) heading.classList.add(headingClassName)
		heading.focus()
	}, [headingClassName, pathname])

	return pageContentRef
}
