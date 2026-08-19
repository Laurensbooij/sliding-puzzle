import { AppHeader } from '@widgets/AppHeader'
import { SettingsDialog } from '@widgets/SettingsDialog'
import type { FC } from 'react'
import { useState } from 'react'
import { Outlet } from 'react-router'

import styles from './AppShell.module.css'
import { useDocumentTitle } from './hooks/use-document-title/use-document-title'
import { useFocusHeadingOnNavigation } from './hooks/use-focus-heading-on-navigation/use-focus-heading-on-navigation'

/**
 * The frame every screen mounts inside: the app header above, the routed screen
 * below. It is the router's layout route, which is what lets it own the two
 * jobs a route change owes a screen-reader user — the document title and the
 * focus move to the new heading.
 *
 * It also owns whether Settings is open. Plain `useState` rather than a
 * provider: exactly one thing opens the dialog and exactly one thing renders it,
 * and both are here. The dialog sits beside `main` rather than inside it —
 * it is app chrome like the header, not part of any screen — and outside every
 * route, so it survives navigation and opens from wherever the player is.
 */
export const AppShell: FC = () => {
	useDocumentTitle()
	const pageContentRef = useFocusHeadingOnNavigation(styles.routeHeading)
	const [settingsOpen, setSettingsOpen] = useState(false)

	return (
		<div className={styles.appShell}>
			<AppHeader onOpenSettings={() => setSettingsOpen(true)} />
			<main ref={pageContentRef} className={styles.pageContent}>
				<Outlet />
			</main>
			<SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
		</div>
	)
}
