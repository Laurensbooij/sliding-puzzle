import { AppHeader } from '@widgets/AppHeader'
import type { FC } from 'react'
import { Outlet } from 'react-router'

import styles from './AppShell.module.css'
import { useDocumentTitle } from './hooks/use-document-title/use-document-title'
import { useFocusHeadingOnNavigation } from './hooks/use-focus-heading-on-navigation/use-focus-heading-on-navigation'

/**
 * TEMPORARY — SLI-66 builds the SettingsDialog and replaces this with opening
 * it. The header is wired to the seam it will use; nothing behind the seam
 * exists yet, which is why the gear currently answers with nothing.
 */
const openSettings = () => {
	// Intentionally empty until SLI-66.
}

/**
 * The frame every screen mounts inside: the app header above, the routed screen
 * below. It is the router's layout route, which is what lets it own the two
 * jobs a route change owes a screen-reader user — the document title and the
 * focus move to the new heading.
 */
export const AppShell: FC = () => {
	useDocumentTitle()
	const pageContentRef = useFocusHeadingOnNavigation(styles.routeHeading)

	return (
		<div className={styles.appShell}>
			<AppHeader onOpenSettings={openSettings} />
			<main ref={pageContentRef} className={styles.pageContent}>
				<Outlet />
			</main>
		</div>
	)
}
