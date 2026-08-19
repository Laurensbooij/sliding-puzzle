import { useSettings } from '@/lib/settings'
import { IconButton } from '@components/IconButton'
import { Modal } from '@components/Modal'
import { Switch } from '@components/Switch'
import { Message, useTranslate } from '@i18n'
import { globalMessages } from '@messages'
import type { FC } from 'react'
import { useId } from 'react'

import styles from './SettingsDialog.module.css'
import { SETTINGS_DIALOG_TESTIDS } from './constants'
import { settingsDialogMessages } from './translation-messages'

export interface SettingsDialogProps {
	/** Whether the dialog is showing. It never opens or closes on its own. */
	open: boolean
	/** Asked to close: Escape, the ✕, and a click on the scrim. */
	onClose: () => void
}

/**
 * The player's three display preferences, over a blurred scrim.
 *
 * A `Modal` card rather than a `Dialog` one: the design draws no tone badge, no
 * supporting line under the title and no action row, and `Dialog` requires all
 * three. What it does draw is a ✕ beside the heading rather than in the corner,
 * which is the other half of why this card is its own.
 *
 * Every switch writes straight through to `useSettings()`, which persists. There
 * is no draft and no confirm step: all three are presentational, so a change
 * mid-game changes how the game looks and nothing about the game.
 *
 * The scrim closes it, against `Modal`'s default and against `Dialog`. Dismissing
 * Settings loses nothing, while dismissing a confirmation decides something.
 *
 * Figma draws a fourth row under the switches — a keyboard glyph and "Arrow keys
 * pick the tile next to the gap." It is deliberately not built. Two consequences
 * worth having written down: ADR-0014's arrow-key accelerator now has no UI
 * mention at all, which is accepted because Tab to a movable tile then Space is
 * the discoverable path and a line inside a dialog most players never open was
 * never real discoverability; and `Icon`'s `keyboard` glyph has no consumer left.
 *
 * One composition at every width — same head, same three switches, same order.
 * Only the card's own width moves, which is CSS, so no runtime branch (ADR-0016).
 *
 * Nothing here announces. The dialog announces itself by taking focus, and each
 * switch announces its own flip through `aria-checked` on the focused control
 * (see `Switch`). A live region for either would double-speak.
 */
export const SettingsDialog: FC<SettingsDialogProps> = ({ open, onClose }) => {
	const generatedId = useId()
	const { translate } = useTranslate()
	const {
		referenceImage,
		numberedTiles,
		showTimer,
		setReferenceImage,
		setNumberedTiles,
		setShowTimer,
	} = useSettings()

	const base = SETTINGS_DIALOG_TESTIDS.BASE
	const titleId = `settings-dialog-title-${generatedId}`

	return (
		<Modal
			open={open}
			onClose={onClose}
			labelledBy={titleId}
			scrimClose
			className={styles.settingsDialog}
			dataTestId={base}
		>
			<div className={styles.head}>
				<h2 id={titleId} className={styles.title}>
					<Message message={settingsDialogMessages.title} />
				</h2>
				{/* In flow beside the heading, not absolutely positioned the way
				    `Dialog`'s corner ✕ is — the design puts it on the head row. */}
				<IconButton
					icon="x"
					label={translate(globalMessages.close)}
					variant="ghost"
					onClick={onClose}
					dataTestId={`${base}${SETTINGS_DIALOG_TESTIDS.CLOSE_SUFFIX}`}
				/>
			</div>
			<div className={styles.rows}>
				<Switch
					label={<Message message={settingsDialogMessages.referenceImageLabel} />}
					description={
						<Message message={settingsDialogMessages.referenceImageDescription} />
					}
					checked={referenceImage}
					onChange={(event) => setReferenceImage(event.target.checked)}
					dataTestId={`${base}${SETTINGS_DIALOG_TESTIDS.REFERENCE_IMAGE_SUFFIX}`}
				/>
				<Switch
					label={<Message message={settingsDialogMessages.numberedTilesLabel} />}
					description={
						<Message message={settingsDialogMessages.numberedTilesDescription} />
					}
					checked={numberedTiles}
					onChange={(event) => setNumberedTiles(event.target.checked)}
					dataTestId={`${base}${SETTINGS_DIALOG_TESTIDS.NUMBERED_TILES_SUFFIX}`}
				/>
				{/* No description: the design gives this row the label alone. */}
				<Switch
					label={<Message message={settingsDialogMessages.showTimerLabel} />}
					checked={showTimer}
					onChange={(event) => setShowTimer(event.target.checked)}
					dataTestId={`${base}${SETTINGS_DIALOG_TESTIDS.SHOW_TIMER_SUFFIX}`}
				/>
			</div>
		</Modal>
	)
}
