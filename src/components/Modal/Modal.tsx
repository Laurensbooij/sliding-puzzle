import { cx } from '@css-utils'
import type { ComponentPropsWithoutRef, FC, MouseEvent, SyntheticEvent } from 'react'
import { useLayoutEffect, useRef } from 'react'

import styles from './Modal.module.css'
import { MODAL_TESTIDS } from './constants'

export interface ModalProps extends Omit<
	ComponentPropsWithoutRef<'dialog'>,
	// The shell owns every route into and out of the top layer, plus the two
	// ARIA hooks it points at the consumer's own markup. Leaving these open
	// would let a caller name the shell twice, or open it behind the
	// component's back and lose the scroll lock with it.
	'aria-describedby' | 'aria-labelledby' | 'onCancel' | 'onClose' | 'open' | 'role' | 'tabIndex'
> {
	/** Whether the modal is showing. It never opens or closes on its own. */
	open: boolean
	/**
	 * Asked to close: Escape, and the scrim when `scrimClose` is on.
	 *
	 * A request, not a notification — the element stays up until `open` goes
	 * false, so this is where the owner decides. Shadows the native
	 * `close`-event handler of the same name, which the shell keeps to itself.
	 */
	onClose: () => void
	/**
	 * Id of the element that names the modal — its heading.
	 *
	 * Required: the shell draws nothing of its own, so it has no heading to be
	 * named by. A modal that reaches the top layer unnamed announces itself as
	 * bare "dialog", which is why this is a type error rather than a default.
	 */
	labelledBy: string
	/** Id of the element describing the modal, read out after its name. */
	describedBy?: string
	/**
	 * Lets a click on the scrim ask to close.
	 *
	 * Off by default: a modal is up because something needs answering, and a
	 * stray click outside it is not an answer.
	 *
	 * A card that paints itself onto the shell rather than into a child of it
	 * turns its own padding into scrim, since a click there lands on the dialog
	 * element like any other. Give such a card a child to hold its box, or leave
	 * this off.
	 */
	scrimClose?: boolean
	/** Overrides the BASE testid. */
	dataTestId?: string
}

/**
 * The modal shell: a native `<dialog>` in the top layer, and nothing visual.
 *
 * Opened with `showModal()` (ADR-0011), so the browser supplies what is
 * otherwise the hard half of a modal — the top layer, the focus trap, the inert
 * background, Escape, and focus restored to whatever opened it. Only two pieces
 * are not native and are hand-added here: the scroll lock on the page behind,
 * and where focus lands on open.
 *
 * Focus lands on the shell itself rather than the first control inside. A
 * screen reader then reads the name and description before any control, and a
 * stray Enter cannot fire a destructive primary. The shell takes no focus ring
 * of its own, for the same reason it is not a tab stop: it is somewhere focus
 * rests to be read, not a control being operated. Everything operable inside it
 * keeps its own indicator, unclipped (SC 2.4.11).
 *
 * Fully controlled: Escape and the scrim call `onClose` and nothing else, so
 * `open` stays the single answer to whether the modal is up. The browser's own
 * Escape close is prevented for the same reason — letting it through would
 * leave the DOM and the owner's state disagreeing for a render.
 *
 * It renders no close control. The ✕ sits somewhere different in every card —
 * floating over one corner, inline beside a heading in the next — so the card
 * on top of this shell draws its own.
 */
export const Modal: FC<ModalProps> = ({
	open,
	onClose,
	labelledBy,
	describedBy,
	scrimClose = false,
	dataTestId,
	className,
	children,
	...dialogProps
}) => {
	const dialogRef = useRef<HTMLDialogElement>(null)
	// Where the press that produced a click started. A drag out of the card and
	// onto the scrim ends in a click on the dialog element, indistinguishable
	// from a scrim click without it.
	const pressOriginRef = useRef<EventTarget | null>(null)

	// Layout effects, not passive ones: focus has to land and the page behind
	// has to stop scrolling before the browser paints the open modal, or the
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
		// whenever the modal is re-mounted under an unchanged `open`.
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

	// Escape reaches the shell as the UA's `cancel`, and preventing it is what
	// keeps the close controlled: the modal goes down when `open` does, not when
	// the browser decides.
	const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
		event.preventDefault()
		onClose()
	}

	const handleMouseDown = (event: MouseEvent<HTMLDialogElement>) => {
		pressOriginRef.current = event.target
	}

	// `::backdrop` is a pseudo-element and takes no listener of its own, so a
	// scrim click surfaces here as a click whose target *is* the dialog element.
	// A press that began inside the card and released on the scrim reports the
	// same target — hence the origin check, without which a stray text selection
	// closes the modal.
	const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
		if (!scrimClose) return
		if (event.target !== event.currentTarget) return
		if (pressOriginRef.current !== event.currentTarget) return
		onClose()
	}

	return (
		// The scrim is a dismissal affordance, not a control: Escape is its
		// keyboard equivalent and the UA gives every modal one. The handlers have
		// to sit here because `::backdrop` takes no listener of its own — there
		// is no interactive element underneath to move them onto.
		// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
		<dialog
			{...dialogProps}
			ref={dialogRef}
			// Focusable only by the effect above — never a tab stop of its own.
			tabIndex={-1}
			aria-labelledby={labelledBy}
			aria-describedby={describedBy}
			className={cx(styles.modal, className)}
			data-testid={dataTestId ?? MODAL_TESTIDS.BASE}
			onCancel={handleCancel}
			onMouseDown={handleMouseDown}
			onClick={handleClick}
		>
			{children}
		</dialog>
	)
}
