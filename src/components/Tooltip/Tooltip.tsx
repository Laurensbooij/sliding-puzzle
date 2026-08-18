import type { CSSProperties, FC, ReactElement, ReactNode } from 'react'
import { cloneElement, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

import styles from './Tooltip.module.css'
import { TOOLTIP_TESTIDS } from './constants'

/** Which side of the trigger the tooltip sits on. */
export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left'

/** The subset of trigger props the tooltip reads and augments. */
export interface TooltipTriggerProps {
	'aria-describedby'?: string
}

export interface TooltipProps {
	/** Supplementary content shown while the trigger is hovered or focused. */
	content: ReactNode
	/** Which side of the trigger the tooltip sits on. */
	placement?: TooltipPlacement
	/** The trigger. Gains `aria-describedby` for as long as the tooltip is open. */
	children: ReactElement<TooltipTriggerProps>
	/** Overrides the BASE testid. */
	dataTestId?: string
}

/**
 * Supplementary text anchored to a trigger, shown on hover *and* on focus.
 *
 * Built on the popover API and CSS anchor positioning (ADR-0011): the top layer
 * frees it from every ancestor's overflow and stacking context, so no portal is
 * needed. The WCAG 1.4.13 behaviours are hand-written — hoverable (a transparent
 * bridge spans the gap so the pointer can reach the tooltip), dismissible (Esc
 * from anywhere, since the pointer may hover while focus sits elsewhere), and
 * persistent (nothing times it out).
 *
 * Not a toggletip: the content is supplementary, never the trigger's only label.
 *
 * Unlike every other shared component, this one has **no Figma component set** —
 * the design file's pages run Button, IconButton, Badge, Card, StatCard,
 * SegmentedControl, Switch, Select, Dialog and stop. The surface, radius,
 * padding, type and shadow below are therefore derived from Foundations and the
 * system's own rule that anything which is not the frame or a tile is flat
 * chrome. Retrace them against the real component set once it lands (SLI-29).
 */
export const Tooltip: FC<TooltipProps> = ({ content, placement = 'top', children, dataTestId }) => {
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

	const ownDescribedBy = children.props['aria-describedby']
	const describedBy = isOpen
		? [ownDescribedBy, tooltipId].filter(Boolean).join(' ')
		: ownDescribedBy

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
			{cloneElement(children, { 'aria-describedby': describedBy })}
			<span
				ref={popoverRef}
				id={tooltipId}
				role="tooltip"
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
