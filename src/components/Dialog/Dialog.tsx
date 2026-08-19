import { Icon } from '@components/Icon'
import { IconButton } from '@components/IconButton'
import { Modal } from '@components/Modal'
import type { ModalProps } from '@components/Modal'
import { cx } from '@css-utils'
import { useTranslate } from '@i18n'
import { globalMessages } from '@messages'
import type { FC, ReactNode } from 'react'
import { useId } from 'react'

import styles from './Dialog.module.css'
import { DIALOG_KINDS, DIALOG_KIND_GLYPHS, DIALOG_TESTIDS } from './constants'

/** Which of the designed cards this is: a celebration or a question. */
export type DialogKind = (typeof DIALOG_KINDS)[number]

export interface DialogProps extends Omit<
	ModalProps,
	// The card names itself and keeps the scrim shut — see the docblock.
	'children' | 'describedBy' | 'labelledBy' | 'scrimClose' | 'title'
> {
	/** Whether the card is showing. The card never opens or closes on its own. */
	open: boolean
	/** Which designed card this is. Defaults to `confirm`. */
	kind?: DialogKind
	/** The heading, and the card's accessible name. */
	title: ReactNode
	/**
	 * The supporting line under the title, and the card's accessible description.
	 * Required: both designed cards carry one.
	 */
	description: ReactNode
	/**
	 * The action row: `Button`s in the designed order, primary first. A card
	 * always offers a way out here, since the close control below is opt-in.
	 */
	actions: ReactNode
	/** Asked to close: Escape, and the close control when there is one. */
	onClose: () => void
	/**
	 * Adds an `IconButton` close control in the top-right corner. Off by
	 * default — the Figma set draws no close affordance.
	 */
	dismissible?: boolean
	/** Overrides the BASE testid, suffixes included. */
	dataTestId?: string
}

/**
 * The designed card: a tone badge, a title, a supporting line and a row of
 * actions, over a blurred scrim.
 *
 * `Modal` is the shell underneath — the top layer, focus landing, the scroll
 * lock and the controlled Escape. This component contributes the Figma
 * component set's two variants, `win` and `confirm`, and the ids that name
 * and describe the shell.
 *
 * Focus lands on the card itself rather than the first action, so a screen
 * reader reads the title and description first and a stray Enter can't fire
 * a destructive primary. The scrim is inert by design: a stray click
 * shouldn't throw away a game.
 */
export const Dialog: FC<DialogProps> = ({
	open,
	kind = 'confirm',
	title,
	description,
	actions,
	onClose,
	dismissible = false,
	dataTestId,
	className,
	...modalProps
}) => {
	const generatedId = useId()
	const { translate } = useTranslate()

	const base = dataTestId ?? DIALOG_TESTIDS.BASE
	const titleId = `dialog-title-${generatedId}`
	const descriptionId = `dialog-description-${generatedId}`

	return (
		<Modal
			{...modalProps}
			open={open}
			onClose={onClose}
			labelledBy={titleId}
			describedBy={descriptionId}
			scrimClose={false}
			className={cx(styles.dialog, className)}
			dataTestId={base}
		>
			{dismissible && (
				<div className={styles.dismiss}>
					<IconButton
						icon="x"
						label={translate(globalMessages.close)}
						variant="ghost"
						size="sm"
						onClick={onClose}
						dataTestId={`${base}${DIALOG_TESTIDS.CLOSE_SUFFIX}`}
					/>
				</div>
			)}
			<div className={styles.head}>
				{/* Decorative — the title already carries the tone. Figma draws
				    the glyph at 26px, between the icon scale's 24 and 32
				    (ADR-0010); `lg` is the nearer step. */}
				<span
					className={cx(styles.badge, styles[kind])}
					data-testid={`${base}${DIALOG_TESTIDS.BADGE_SUFFIX}`}
				>
					<Icon name={DIALOG_KIND_GLYPHS[kind]} size="lg" />
				</span>
				<div className={styles.text}>
					<h2 id={titleId} className={styles.title}>
						{title}
					</h2>
					<p id={descriptionId} className={styles.description}>
						{description}
					</p>
				</div>
			</div>
			<div className={styles.actions}>{actions}</div>
		</Modal>
	)
}
