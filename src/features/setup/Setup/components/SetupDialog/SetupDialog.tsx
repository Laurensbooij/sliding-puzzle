import { IconButton } from '@components/IconButton'
import { Modal } from '@components/Modal'
import { Message, useTranslate } from '@i18n'
import { globalMessages } from '@messages'
import type { FC } from 'react'
import { useId } from 'react'

import { SetupControls } from '../SetupControls'
import { SetupPreview } from '../SetupPreview'
import styles from './SetupDialog.module.css'
import { SETUP_DIALOG_TESTIDS } from './constants'
import { setupDialogMessages } from './translation-messages'

export interface SetupDialogProps {
	/** Whether the dialog is showing. It never opens or closes on its own. */
	open: boolean
	/** Asked to close: Escape, the ✕, or a click on the scrim. */
	onClose: () => void
	/** Called when the player starts a game from inside the dialog. */
	onStart: () => void
}

/**
 * Setup's choices on a narrow viewport, over a blurred scrim.
 *
 * A dialog, not a sheet, whatever Figma's node is called: the design centres a
 * card with even side margins, with no anchor, no drag handle and no slide-up.
 * Naming it a sheet would teach a distinction the design does not make.
 *
 * `Modal`, not `Dialog` — that card is a tone badge, a title, a required
 * description and an action row, and this one has neither badge nor description.
 * The card is a child of the shell rather than the shell's own box: with
 * `scrimClose` on, `Modal` reads any click landing on the dialog element itself
 * as a scrim click, so the card's padding needs a box of its own to absorb them.
 *
 * The scrim closes, against `Dialog`'s default and matching `SettingsDialog`:
 * every choice is already written through to the config, so dismissing loses
 * nothing. That is also why the design draws a ✕ and no Cancel.
 *
 * No live region: focus landing on the card announces the dialog, and each
 * control announces its own state.
 */
export const SetupDialog: FC<SetupDialogProps> = ({ open, onClose, onStart }) => {
	const generatedId = useId()
	const { translate } = useTranslate()

	const base = SETUP_DIALOG_TESTIDS.BASE
	const titleId = `setup-dialog-title-${generatedId}`

	return (
		<Modal open={open} onClose={onClose} labelledBy={titleId} scrimClose dataTestId={base}>
			<div className={styles.card} data-testid={`${base}${SETUP_DIALOG_TESTIDS.CARD_SUFFIX}`}>
				<div className={styles.head}>
					<h2 id={titleId} className={styles.title}>
						<Message message={setupDialogMessages.title} />
					</h2>
					<IconButton
						icon="x"
						label={translate(globalMessages.close)}
						variant="ghost"
						onClick={onClose}
						dataTestId={`${base}${SETUP_DIALOG_TESTIDS.CLOSE_SUFFIX}`}
					/>
				</div>

				<div className={styles.preview}>
					<SetupPreview dataTestId={`${base}${SETUP_DIALOG_TESTIDS.PREVIEW_SUFFIX}`} />
				</div>

				<SetupControls onStart={onStart} />
			</div>
		</Modal>
	)
}
