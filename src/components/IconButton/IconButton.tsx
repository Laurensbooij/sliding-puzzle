import { Icon } from '@components/Icon'
import type { IconName } from '@components/Icon'
import { Tooltip } from '@components/Tooltip'
import type { TooltipPlacement } from '@components/Tooltip'
import { cx } from '@css-utils'
import type { ComponentPropsWithoutRef, FC } from 'react'

import styles from './IconButton.module.css'
import { ICON_BUTTON_SIZES, ICON_BUTTON_TESTIDS, ICON_BUTTON_VARIANTS } from './constants'

/** Paint of the control: `onWood` is the only one allowed on the wooden frame. */
export type IconButtonVariant = (typeof ICON_BUTTON_VARIANTS)[number]

/** Square edge of the control: sm 32 · md 40 · lg 48, matching Button. */
export type IconButtonSize = (typeof ICON_BUTTON_SIZES)[number]

export interface IconButtonProps extends Omit<
	ComponentPropsWithoutRef<'button'>,
	// The component owns its accessible name, its box and its semantics. Leaving
	// these open would let a caller ship an unnamed icon-only control, take it
	// off the size scale, or turn it into a form submit by accident.
	'aria-label' | 'aria-labelledby' | 'children' | 'className' | 'type'
> {
	/** Which glyph to draw. */
	icon: IconName
	/**
	 * What the control does — its accessible name *and* the tooltip copy.
	 *
	 * Mandatory: an icon alone names nothing. Pass a translated string from
	 * `useTranslate()` (ADR-0008); a literal here ships English into every
	 * locale.
	 */
	label: string
	/** Paint of the control. Defaults to `solid`. */
	variant?: IconButtonVariant
	/** Square edge of the control. Defaults to `md` (40px). */
	size?: IconButtonSize
	/**
	 * Which side the tooltip opens on. Defaults to `top`, and needs saying only
	 * where there is no room above — a control against the top of the viewport
	 * gets a chip the browser holds on screen, over the button and its focus
	 * ring.
	 */
	tooltipPlacement?: TooltipPlacement
	/** Overrides the BASE testid for instances rendered in a collection. */
	dataTestId?: string
}

/**
 * An icon-only control: one Lucide glyph in a square box with `radius/md`, so
 * it reads as a tool rather than an action.
 *
 * `label` is the whole accessibility contract and there is no way to omit it.
 * It names the button for assistive technology and shows as a Tooltip on hover
 * and on keyboard focus, so the sighted user and the screen-reader user learn
 * the same thing. The chip repeats a name AT already has, so Tooltip keeps it
 * out of the accessibility tree rather than announcing it twice.
 *
 * The smallest size is 32px square, comfortably past the 24px floor of WCAG SC
 * 2.5.8 — there is no compact variant that dips under it.
 *
 * Nothing here announces: the control carries no state of its own, so there is
 * no change for a live region to report. Whatever it triggers owns that.
 */
export const IconButton: FC<IconButtonProps> = ({
	icon,
	label,
	variant = 'solid',
	size = 'md',
	tooltipPlacement,
	dataTestId,
	...buttonProps
}) => {
	const base = dataTestId ?? ICON_BUTTON_TESTIDS.BASE

	return (
		<Tooltip
			content={label}
			placement={tooltipPlacement}
			dataTestId={`${base}${ICON_BUTTON_TESTIDS.TOOLTIP_SUFFIX}`}
		>
			<button
				{...buttonProps}
				type="button"
				className={cx(styles.button, styles[variant], styles[size])}
				data-testid={base}
				aria-label={label}
			>
				{/* The control sizes share the Icon scale's names, so one step
				    drives both. The design file draws 16/18/22 rather than
				    16/20/24, but 18 and 22 are unbound literals there while the
				    Icon scale is token-bound — matching them would mean inventing
				    `--icon-size-*` tokens that name a Figma path which does not
				    exist (ADR-0010). */}
				<Icon name={icon} size={size} />
			</button>
		</Tooltip>
	)
}
