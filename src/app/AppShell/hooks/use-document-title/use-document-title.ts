import { isRouteHandle } from '@/app/routes/guards'
import { useTranslate } from '@i18n'
import { useEffect } from 'react'
import { useMatches } from 'react-router'

/**
 * Keeps `document.title` in step with the matched route.
 *
 * The title comes off the deepest match's `handle`, so a route declares its own
 * title next to its path and the shell stays ignorant of which screens exist.
 * A match without a handle leaves the title alone rather than blanking it —
 * the only such route is the catch-all, which redirects on the same tick.
 */
export const useDocumentTitle = (): void => {
	const { translate } = useTranslate()
	const matches = useMatches()

	const handle = matches.at(-1)?.handle
	const title = isRouteHandle(handle) ? translate(handle.title) : undefined

	useEffect(() => {
		if (title !== undefined) document.title = title
	}, [title])
}
