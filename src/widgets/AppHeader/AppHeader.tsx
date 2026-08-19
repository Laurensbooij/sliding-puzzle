import { ROUTES } from '@/lib/routes'
import { IconButton } from '@components/IconButton'
import { Message, useTranslate } from '@i18n'
import { globalMessages } from '@messages'
import type { FC } from 'react'
import { NavLink } from 'react-router'

import styles from './AppHeader.module.css'
import { APP_HEADER_TESTIDS } from './constants'
import { appHeaderMessages } from './translation-messages'

export interface AppHeaderProps {
	/**
	 * Called when the gear is pressed. The header opens nothing itself — the
	 * SettingsDialog is SLI-66, and whoever composes the header owns it.
	 */
	onOpenSettings: () => void
	/** Overrides the BASE testid. */
	dataTestId?: string
}

/**
 * The app's persistent chrome: the wordmark on the left, the gear on the right.
 * It sits outside `page-content`, above every screen, which is what makes it the
 * *app* header rather than a page header.
 *
 * Keyboard operation map, asserted in full in the spec:
 *
 * - **Tab** — the wordmark, then the gear. Two stops, in reading order, and
 *   they are the first two on every screen.
 * - **Enter** — follows the wordmark home.
 * - **Space / Enter** — presses the gear (the button's own behaviour).
 *
 * Figma draws the wordmark inert, and it is a link anyway: it is the header's
 * only way back to Setup, and a brand that goes home is what every user already
 * expects. `NavLink` rather than `Link` for one reason — it is the one that
 * carries `aria-current="page"` while Setup is the route. That state is
 * deliberately silent to the eye: the design gives the wordmark no active
 * treatment, and inventing one would be a design decision made in code.
 *
 * Figma's `app-brand` reads "Slider Puzzle". That is a typo in the design file;
 * the app is called Sliding Puzzle, and the name comes from `@messages` so it
 * is spelled in exactly one place.
 *
 * One nav control, not the three Figma draws. The trophy would open Records,
 * which was cut from scope, and the speaker would toggle sound, which does not
 * exist — so neither is built and no slot is held open for them. A control that
 * does nothing is worse than a control that is not there.
 *
 * Mid-game the two behave differently, and that is intended: the gear stays live
 * because it opens a dialog over the game, while the wordmark navigates away and
 * so has to meet the abandon guard (SLI-54). Whoever wires the guard blocks the
 * navigation, not the header.
 *
 * The `Breakpoint` variant of the Figma component set is a media query, not a
 * prop: the two designs differ only in padding and wordmark size, so nothing
 * about the tree changes across it and CSS is enough (ADR-0016).
 */
export const AppHeader: FC<AppHeaderProps> = ({ onOpenSettings, dataTestId }) => {
	const { translate } = useTranslate()
	const base = dataTestId ?? APP_HEADER_TESTIDS.BASE

	return (
		<header className={styles.appHeader} data-testid={base}>
			{/* `end` because every path starts with `/`: without it the wordmark
			    would report itself as the current page from every screen. */}
			<NavLink
				to={ROUTES.setup}
				end
				className={styles.wordmark}
				data-testid={`${base}${APP_HEADER_TESTIDS.WORDMARK_SUFFIX}`}
			>
				<Message message={globalMessages.appName} />
			</NavLink>
			{/* The chip opens downward here, against its own default: the header is
			    the top of the viewport, and a chip placed above has nowhere to go
			    but back down over the gear and its focus ring. */}
			<IconButton
				icon="settings"
				label={translate(appHeaderMessages.settings)}
				variant="ghost"
				size="md"
				tooltipPlacement="bottom"
				onClick={onOpenSettings}
				dataTestId={`${base}${APP_HEADER_TESTIDS.SETTINGS_SUFFIX}`}
			/>
		</header>
	)
}
