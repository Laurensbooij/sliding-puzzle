import { cx } from '@css-utils'
import type { ComponentPropsWithoutRef, FC, MouseEvent, SyntheticEvent } from 'react'
import { useLayoutEffect, useRef } from 'react'

import styles from './Modal.module.css'
import { MODAL_TESTIDS } from './constants'

export interface ModalProps extends Omit<
	ComponentPropsWithoutRef<'dialog'>,
	// The shell owns naming, opening and closing — a caller can't reach around it.
	'aria-describedby' | 'aria-labelledby' | 'onCancel' | 'onClose' | 'open' | 'role' | 'tabIndex'
> {
	/** Whether the modal is showing. It never opens or closes on its own. */
	open: boolean
	/**
	 * Asked to close: Escape, and the scrim when `scrimClose` is on.
	 * A request, not a notification — the modal closes only once `open` goes false.
	 */
	onClose: () => void
	/**
	 * Id of the element that names the modal — its heading.
	 * Required: the shell draws no heading of its own, so a caller must supply one.
	 */
	labelledBy: string
	/** Id of the element describing the modal, read out after its name. */
	describedBy?: string
	/**
	 * Lets a click on the scrim ask to close. Off by default — a modal is up
	 * because something needs answering, and a stray click is not an answer.
	 */
	scrimClose?: boolean
	/** Overrides the BASE testid. */
	dataTestId?: string
}

/**
 * The modal shell: a native `<dialog>` in the top layer, and nothing visual.
 *
 * Opened with `showModal()` (ADR-0011), which supplies the top layer, the
 * focus trap, the inert background, Escape, and focus restored on close. The
 * scroll lock and where focus lands are hand-added.
 *
 * Focus lands on the shell itself, not the first control, so a screen reader
 * reads the name and description first and a stray Enter can't fire a
 * destructive primary. The shell takes no focus ring of its own — it's a
 * focus target, not a tab stop.
 *
 * Fully controlled: only `onClose` asks to close, never the browser's own
 * Escape handling. Renders no close control — every card places its own ✕
 * differently, so each draws it themselves.
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
	// Where the current press started, so a drag from the card onto the scrim
	// isn't mistaken for a scrim click.
	const pressOriginRef = useRef<EventTarget | null>(null)

	// Layout, not passive: focus and the scroll lock must settle before paint.
	useLayoutEffect(() => {
		const dialog = dialogRef.current
		if (!dialog) return

		if (!open) {
			dialog.close()
			return
		}

		// showModal() throws if already open, which a re-mount under an
		// unchanged `open` would otherwise trigger.
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

	// Escape reaches the shell as `cancel`; preventing it keeps close controlled.
	const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
		event.preventDefault()
		onClose()
	}

	const handleMouseDown = (event: MouseEvent<HTMLDialogElement>) => {
		pressOriginRef.current = event.target
	}

	// `::backdrop` takes no listener, so a scrim click surfaces as a click whose
	// target is the dialog element itself — same as a drag released outside the
	// card, hence the press-origin check.
	const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
		if (!scrimClose) return
		if (event.target !== event.currentTarget) return
		if (pressOriginRef.current !== event.currentTarget) return
		onClose()
	}

	return (
		// The scrim's click handlers live here because `::backdrop` has none of
		// its own to delegate to.
		// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
		<dialog
			{...dialogProps}
			ref={dialogRef}
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
