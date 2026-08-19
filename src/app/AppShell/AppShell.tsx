import type { FC } from 'react'
import { Outlet } from 'react-router'

import styles from './AppShell.module.css'
import { APP_SHELL_TESTIDS } from './constants'
import { useDocumentTitle } from './hooks/use-document-title/use-document-title'
import { useFocusHeadingOnNavigation } from './hooks/use-focus-heading-on-navigation/use-focus-heading-on-navigation'

/**
 * The frame every screen mounts inside: the app header above, the routed screen
 * below. It is the router's layout route, which is what lets it own the two
 * jobs a route change owes a screen-reader user — the document title and the
 * focus move to the new heading.
 */
export const AppShell: FC = () => {
	useDocumentTitle()
	const pageContentRef = useFocusHeadingOnNavigation()

	return (
		<div className={styles.appShell} data-testid={APP_SHELL_TESTIDS.BASE}>
			{/* AppHeader mounts here — SLI-53. */}
			<main
				ref={pageContentRef}
				className={styles.pageContent}
				data-testid={`${APP_SHELL_TESTIDS.BASE}${APP_SHELL_TESTIDS.PAGE_CONTENT_SUFFIX}`}
			>
				<Outlet />
			</main>
		</div>
	)
}
