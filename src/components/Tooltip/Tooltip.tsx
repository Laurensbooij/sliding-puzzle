import type { CSSProperties, FC, ReactElement, ReactNode } from 'react'
import { cloneElement, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

import styles from './Tooltip.module.css'
import { TOOLTIP_TESTIDS } from './constants'

/** Which side of the trigger the tooltip sits on. */
export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left'

/** The subset of trigger props the tooltip reads and augments. */
export interface TooltipTriggerProps {
	'aria-describedby'?: string
	'aria-label'?: string
	title?: string
}

export interface TooltipProps {
	/** Content shown while the trigger is hovered or focused. */
	content: ReactNode
	/** Which side of the trigger the tooltip sits on. */
	placement?: TooltipPlacement
	/**
	 * Whether the chip describes the trigger via `aria-describedby`.
	 *
	 * Defaults to whether the trigger lacks an `aria-label` of its own. A
	 * trigger that has one is already named — the chip repeats that name for
	 * sighted users, and describing with it too makes a screen reader announce
	 * the same words twice, so the chip is hidden from assistive tech instead.
	 * Set it explicitly when the trigger takes its name some other way, such as
	 * a wrapper that applies `aria-label` internally.
	 */
	describesTrigger?: boolean
	/** The trigger. Loses its native `title`; may gain `aria-describedby`. */
	children: ReactElement<TooltipTriggerProps>
	/** Overrides the BASE testid. */
	dataTestId?: string
}

/**
 * Names the control it wraps, on hover *and* on keyboard focus. One flat dark
 * chip, no arrow, offset --space-2 from the trigger on all four placements.
 *
 * Built on the popover API and CSS anchor positioning (ADR-0011): the top layer
 * frees it from every ancestor's overflow and stacking context, so no portal is
 * needed. The WCAG 1.4.13 behaviours are hand-written — hoverable (a transparent
 * bridge spans the gap so the pointer can reach the tooltip), dismissible (Esc
 * from anywhere, since the pointer may hover while focus sits elsewhere), and
 * persistent (nothing times it out).
 *
 * Not a toggletip, and never the trigger's only label: the design has it name
 * icon-only controls whose `aria-label` already carries that name, so by
 * default the chip is the sighted half of a label AT already has, and stays out
 * of the accessibility tree. It must never hold help copy, error text, or
 * anything a user has to read to proceed.
 *
 * One deliberate deviation from Figma, which asks that the chip "never takes
 * pointer events": it has to, or WCAG 1.4.13 Hoverable fails. See the bridge in
 * the stylesheet.
 */
export const Tooltip: FC<TooltipProps> = ({
	content,
	placement = 'top',
	describesTrigger,
	children,
	dataTestId,
}) => {
	// Hover and focus are tracked apart, because either alone keeps the tooltip
	// up: collapsing them into one "open" flag would let the pointer wandering
	// off close a tooltip the keyboard is still holding open. `isDismissed`
	// latches Esc — 1.4.13 wants dismissed content to stay down until hover and
	// focus have *both* left, not to spring back on the next pointer move.
	const [isHovered, setIsHovered] = useState(false)
	const [isFocused, setIsFocused] = useState(false)
	const [isDismissed, setIsDismissed] = useState(false)
	const isOpen = (isHovered || isFocused) && !isDismissed

	const popoverRef = useRef<HTMLSpanElement>(null)
	const generatedId = useId()

	const tooltipId = `tooltip-${generatedId}`
	// Anchor names are dashed-idents; React's generated ids are not.
	const anchorName = `--tooltip-anchor-${generatedId.replaceAll(/[^a-zA-Z0-9]/gu, '')}`

	// The tooltip stays mounted and moves in and out of the top layer, rather
	// than mounting on open: `hidePopover` is what lets the exit transition run,
	// and `showPopover` throws if the popover is already showing.
	useLayoutEffect(() => {
		if (!isOpen) return
		const popover = popoverRef.current
		popover?.showPopover()
		return () => popover?.hidePopover()
	}, [isOpen])

	useEffect(() => {
		if (!isOpen) return

		// Listening on the document, not the trigger: 1.4.13 requires dismissal
		// without moving hover *or* focus, so Esc has to land while the pointer
		// hovers and focus is somewhere else entirely.
		const dismiss = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setIsDismissed(true)
		}
		document.addEventListener('keydown', dismiss)
		return () => document.removeEventListener('keydown', dismiss)
	}, [isOpen])

	const describes = describesTrigger ?? children.props['aria-label'] === undefined
	const ownDescribedBy = children.props['aria-describedby']
	const describedBy =
		isOpen && describes ? [ownDescribedBy, tooltipId].filter(Boolean).join(' ') : ownDescribedBy

	return (
		<span
			className={styles.anchor}
			style={{ '--tooltip-anchor': anchorName } as CSSProperties}
			onPointerEnter={() => setIsHovered(true)}
			onPointerLeave={() => {
				setIsHovered(false)
				if (!isFocused) setIsDismissed(false)
			}}
			onFocus={() => setIsFocused(true)}
			onBlur={() => {
				setIsFocused(false)
				if (!isHovered) setIsDismissed(false)
			}}
		>
			{/* The native title is dropped, not forwarded: leaving it would give the
			    browser a second, unstyled bubble alongside this one. */}
			{cloneElement(children, { 'aria-describedby': describedBy, title: undefined })}
			<span
				ref={popoverRef}
				id={describes ? tooltipId : undefined}
				role={describes ? 'tooltip' : undefined}
				aria-hidden={describes ? undefined : true}
				popover="manual"
				className={styles.tooltip}
				data-placement={placement}
				data-testid={dataTestId ?? TOOLTIP_TESTIDS.BASE}
			>
				{content}
			</span>
		</span>
	)
}
