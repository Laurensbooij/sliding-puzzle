import { Icon } from '@components/Icon'
import { IconButton } from '@components/IconButton'
import { cx } from '@css-utils'
import { useTranslate } from '@i18n'
import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react'
import { useId, useLayoutEffect, useRef } from 'react'

import styles from './Dialog.module.css'
import { DIALOG_KINDS, DIALOG_KIND_GLYPHS, DIALOG_TESTIDS } from './constants'
import { dialogMessages } from './translation-messages'

/** Which of the designed cards this is: a celebration or a question. */
export type DialogKind = (typeof DIALOG_KINDS)[number]

export interface DialogProps extends Omit<
	ComponentPropsWithoutRef<'dialog'>,
	// The card owns its semantics, its accessible name and every route into and
	// out of the top layer. Leaving these open would let a caller name it twice,
	// or open it behind the component's back and lose the scroll lock with it.
	| 'aria-describedby'
	| 'aria-labelledby'
	| 'children'
	| 'onCancel'
	| 'onClose'
	| 'open'
	| 'role'
	| 'tabIndex'
	| 'title'
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
	 * so this is where the owner decides. Shadows the native `close`-event
	 * handler of the same name, which the card keeps to itself.
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
 * The modal card: a tone badge, a title, a supporting line and a row of
 * actions, over a blurred scrim.
 *
 * A native `<dialog>` opened with `showModal()` (ADR-0011), so the browser
 * supplies what is otherwise the hard half of a modal — the top layer, the
 * focus trap, the inert background, Escape, and focus restored to whatever
 * opened it. Only two pieces are not native and are hand-added here: the scroll
 * lock on the page behind, and where focus lands on open.
 *
 * Focus lands on the card itself rather than the first action. A screen reader
 * then reads the title and its description before any control, and a stray
 * Enter cannot fire a destructive primary — the confirm card's is `Abandon`.
 * The card takes no focus ring of its own, for the same reason it is not a tab
 * stop: it is somewhere focus rests to be read, not a control being operated.
 * Everything operable inside it keeps its own indicator, unclipped (SC 2.4.11).
 *
 * Fully controlled: Escape and the close control call `onClose` and nothing
 * else, so `open` stays the single answer to whether the card is up. The
 * browser's own Escape close is prevented for the same reason — letting it
 * through would leave the DOM and the owner's state disagreeing for a render.
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
	...dialogProps
}) => {
	const dialogRef = useRef<HTMLDialogElement>(null)
	const generatedId = useId()
	const { translate } = useTranslate()

	const base = dataTestId ?? DIALOG_TESTIDS.BASE
	const titleId = `dialog-title-${generatedId}`
	const descriptionId = `dialog-description-${generatedId}`

	// Layout effects, not passive ones: focus has to land and the page behind
	// has to stop scrolling before the browser paints the open card, or the
	// first frame shows a focus ring in the wrong place and a scrollbar that is
	// about to vanish.
	useLayoutEffect(() => {
		const dialog = dialogRef.current
		if (!dialog) return

		if (!open) {
			dialog.close()
			return
		}

		// `showModal` throws on an already-open dialog, and this effect re-runs
		// whenever the card is re-mounted under an unchanged `open`.
		if (!dialog.open) dialog.showModal()
		dialog.focus()
	}, [open])

	useLayoutEffect(() => {
		if (!open) return

		const { body } = document
		const previousOverflow = body.style.overflow
		body.style.overflow = 'hidden'
		return () => {
			body.style.overflow = previousOverflow
		}
	}, [open])

	return (
		<dialog
			{...dialogProps}
			ref={dialogRef}
			// Focusable only by the effect above — never a tab stop of its own.
			tabIndex={-1}
			aria-labelledby={titleId}
			aria-describedby={descriptionId}
			className={cx(styles.dialog, className)}
			data-testid={base}
			onCancel={(event) => {
				event.preventDefault()
				onClose()
			}}
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
		</dialog>
	)
}
