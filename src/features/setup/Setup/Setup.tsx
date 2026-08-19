import { useIsDesktop } from '@/lib/use-media-query'
import { Button } from '@components/Button'
import { Message } from '@i18n'
import type { FC } from 'react'
import { useEffect, useRef, useState } from 'react'

import styles from './Setup.module.css'
import { SetupControls } from './components/SetupControls'
import type { SetupControlsHandle } from './components/SetupControls'
import { SetupDialog } from './components/SetupDialog'
import { SetupPreview } from './components/SetupPreview'
import { SETUP_TESTIDS } from './constants'
import { setupMessages } from './translation-messages'

export interface SetupProps {
	/**
	 * Called when the player starts a game. Setup does not know it is mounted at
	 * `/` or that Play is at `/play` — the app tier wires this to a route
	 * (ADR-0017).
	 */
	onStart: () => void
}

/**
 * The screen at `/`: what the game is, what it will look like, and the two
 * choices that decide it.
 *
 * Desktop puts those choices on the page. Mobile moves them into `SetupDialog`,
 * opened by the Start puzzle button the design leaves on the page — so the
 * controls are mounted once at either width, never twice (ADR-0016). The button
 * keeps its label and says `aria-haspopup="dialog"`: it is the primary call to
 * action, and relabelling it "Set up" would make it describe our plumbing.
 *
 * Nothing about the choices lives here. They are held by the game config, which
 * is above the branch — so crossing the breakpoint, dismissing the dialog and
 * reloading the page all leave them exactly as they were.
 *
 * DOM order is preview → pitch → controls at every width. Desktop's grid places
 * the preview in the right column by area, so the reading order a screen reader
 * follows never changes with the viewport.
 */
export const Setup: FC<SetupProps> = ({ onStart }) => {
	const isDesktop = useIsDesktop()
	const [dialogOpen, setDialogOpen] = useState(false)
	const controlsRef = useRef<SetupControlsHandle>(null)

	// Resized or rotated into desktop with the dialog up: it unmounts and its
	// controls reappear inline, leaving focus on <body> (SC 2.4.3). Sending it to
	// the first of those controls is where the dialog's own first stop went.
	useEffect(() => {
		if (!isDesktop || !dialogOpen) return

		setDialogOpen(false)
		controlsRef.current?.focusBoardSize()
	}, [isDesktop, dialogOpen])

	return (
		<div className={styles.setup} data-testid={SETUP_TESTIDS.BASE}>
			<div className={styles.preview}>
				<SetupPreview dataTestId={`${SETUP_TESTIDS.BASE}${SETUP_TESTIDS.PREVIEW_SUFFIX}`} />
			</div>

			<div className={styles.pitch}>
				<h1 className={styles.heading}>
					<Message message={setupMessages.heading} />
				</h1>
				<p className={styles.lede}>
					<Message message={setupMessages.lede} />
				</p>
			</div>

			<div className={styles.controls}>
				{isDesktop ? (
					<SetupControls ref={controlsRef} onStart={onStart} />
				) : (
					<>
						{/* The dialog's own call to action, worded the same on purpose:
						    one button opens the choices, the other acts on them. */}
						<Button
							size="lg"
							iconStart="play"
							aria-haspopup="dialog"
							onClick={() => setDialogOpen(true)}
							dataTestId={`${SETUP_TESTIDS.BASE}${SETUP_TESTIDS.TRIGGER_SUFFIX}`}
						>
							<Message message={setupMessages.start} />
						</Button>

						<SetupDialog
							open={dialogOpen}
							onClose={() => setDialogOpen(false)}
							onStart={onStart}
						/>
					</>
				)}
			</div>
		</div>
	)
}
