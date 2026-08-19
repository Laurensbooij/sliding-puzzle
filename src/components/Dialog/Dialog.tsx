import { Icon } from '@components/Icon'
import { IconButton } from '@components/IconButton'
import { Modal } from '@components/Modal'
import type { ModalProps } from '@components/Modal'
import { cx } from '@css-utils'
import { useTranslate } from '@i18n'
import type { FC, ReactNode } from 'react'
import { useId } from 'react'

import styles from './Dialog.module.css'
import { DIALOG_KINDS, DIALOG_KIND_GLYPHS, DIALOG_TESTIDS } from './constants'
import { dialogMessages } from './translation-messages'

/** Which of the designed cards this is: a celebration or a question. */
export type DialogKind = (typeof DIALOG_KINDS)[number]

export interface DialogProps extends Omit<
	ModalProps,
	// The card names itself from its own title and description, so the two
	// ARIA hooks the shell exposes are not the caller's to point anywhere else.
	// The scrim stays shut for a reason of the card's own — see the docblock.
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
	 *
	 * Required: both designed cards carry one, and it is what focus landing on
	 * the card reads out after the title. Widen this to optional the day a
	 * designed card ships without one.
	 */
	description: ReactNode
	/**
	 * The action row: `Button`s in the designed order, primary first.
	 *
	 * A card always offers a way out here — the close control below is opt-in
	 * and the design does not draw it, so these are the only exit the user is
	 * guaranteed to see.
	 */
	actions: ReactNode
	/**
	 * Asked to close: Escape, and the close control when there is one.
	 *
	 * A request, not a notification — the card stays up until `open` goes false,
	 * so this is where the owner decides.
	 */
	onClose: () => void
	/**
	 * Adds an `IconButton` close control in the top-right corner.
	 *
	 * Off by default: the Figma set draws no close affordance, because both
	 * designed cards already carry an action that dismisses them. Turn it on for
	 * a card whose actions all commit to something.
	 */
	dismissible?: boolean
	/** Overrides the BASE testid, suffixes included. */
	dataTestId?: string
}

/**
 * The designed card: a tone badge, a title, a supporting line and a row of
 * actions, over a blurred scrim.
 *
 * The card and nothing else — `Modal` is the `<dialog>` under it, and owns the
 * top layer, the focus landing, the scroll lock and the controlled Escape. This
 * component contributes the Figma component set's two variants, `win` and
 * `confirm`, and the ids that name and describe the shell.
 *
 * Focus lands on the card itself rather than the first action. A screen reader
 * then reads the title and its description before any control, and a stray
 * Enter cannot fire a destructive primary — the confirm card's is `Abandon`.
 *
 * Clicking the scrim does nothing, deliberately: the design draws no such
 * affordance, and a stray click should not throw away a game.
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
						label={translate(dialogMessages.close)}
						variant="ghost"
						size="sm"
						onClick={onClose}
						dataTestId={`${base}${DIALOG_TESTIDS.CLOSE_SUFFIX}`}
					/>
				</div>
			)}
			<div className={styles.head}>
				{/* Decorative: the badge restates the tone the title already
				    carries, and naming it would announce the same thing twice.
				    Figma draws the glyph at 26px, which is between the icon
				    scale's 24 and 32 (ADR-0010) — `lg` is the nearer step, and
				    inventing a size off the scale to match a literal is what
				    the scale exists to prevent. */}
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
