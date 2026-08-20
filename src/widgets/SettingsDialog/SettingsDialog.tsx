import { IconButton } from '@components/IconButton'
import { Modal } from '@components/Modal'
import { Switch } from '@components/Switch'
import { Message, useTranslate } from '@i18n'
import { globalMessages } from '@messages'
import { useSettings } from '@settings'
import type { FC } from 'react'
import { useId } from 'react'

import styles from './SettingsDialog.module.css'
import { SETTINGS_DIALOG_TESTIDS } from './constants'
import { settingsDialogMessages } from './translation-messages'

export interface SettingsDialogProps {
	/** Whether the dialog is showing. */
	open: boolean
	/** Asked to close: Escape, the ✕, or a scrim click. */
	onClose: () => void
}

/**
 * The player's three display preferences, over a blurred scrim.
 *
 * `Modal`, not `Dialog` — the design has no badge, no description and no
 * action row, all three of which `Dialog` requires.
 *
 * The card is a child of the shell, not the shell's own styling: with
 * `scrimClose` on, `Modal` treats any click landing on the dialog element
 * itself as a scrim click, so the card's padding needs its own box to absorb
 * clicks without dismissing.
 *
 * Switches write straight through to `useSettings()` — no draft, no confirm.
 * The scrim closes too, against `Dialog`'s default: dismissing Settings loses
 * nothing.
 *
 * Figma's keyboard-hint row is deliberately not built (ADR-0014's arrow-key
 * accelerator loses its only UI mention; `Icon`'s `keyboard` glyph loses its
 * last consumer — both accepted).
 *
 * Same composition at every width — CSS-only, no runtime branch (ADR-0016).
 *
 * No live region: focus landing announces the dialog, `aria-checked`
 * announces each switch.
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
		<Modal open={open} onClose={onClose} labelledBy={titleId} scrimClose dataTestId={base}>
			<div
				className={styles.card}
				data-testid={`${base}${SETTINGS_DIALOG_TESTIDS.CARD_SUFFIX}`}
			>
				<div className={styles.head}>
					<h2 id={titleId} className={styles.title}>
						<Message message={settingsDialogMessages.title} />
					</h2>
					{/* In flow beside the heading, unlike `Dialog`'s absolute corner ✕. */}
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
			</div>
		</Modal>
	)
}
