import { Icon } from '@components/Icon'
import type { IconName } from '@components/Icon'
import type { ComponentPropsWithoutRef, FC } from 'react'

import styles from './Button.module.css'
import { BUTTON_ICON_SIZES, BUTTON_SIZES, BUTTON_TESTIDS, BUTTON_VARIANTS } from './constants'

/** Colour treatment. Primary is the one main action per view; danger is destructive only. */
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number]

/** A step on the control scale: sm 32 · md 40 · lg 48. */
export type ButtonSize = (typeof BUTTON_SIZES)[number]

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
	/** Colour treatment. Defaults to `primary`. */
	variant?: ButtonVariant
	/** Step on the control scale. Defaults to `md` (40px). */
	size?: ButtonSize
	/** Leading glyph, named rather than passed as a node — the button sizes it. */
	iconStart?: IconName
	/** Trailing glyph, named rather than passed as a node — the button sizes it. */
	iconEnd?: IconName
	/** Fills the inline axis, for stacked mobile actions. */
	fullWidth?: boolean
	/** Overrides the BASE testid for instances rendered in a collection. */
	dataTestId?: string
}

/**
 * The pill action button — the default control for every non-icon action in UI
 * chrome. Never on the wooden frame; that is IconButton's `onWood` variant.
 *
 * A native `<button>` (ADR-0011), so the browser supplies the whole keyboard
 * model — Enter and Space activate, `disabled` drops it from the tab order — and
 * announces the role itself. Its children are its accessible name, which is why
 * there is no icon-only shape here.
 *
 * `type` defaults to `button`: the native default is `submit`, and a button that
 * silently submits the form it happens to sit in is the wrong default for a
 * design-system control.
 */
export const Button: FC<ButtonProps> = ({
	variant = 'primary',
	size = 'md',
	iconStart,
	iconEnd,
	fullWidth = false,
	type = 'button',
	dataTestId,
	className,
	children,
	...buttonProps
}) => {
	const base = dataTestId ?? BUTTON_TESTIDS.BASE
	const iconSize = BUTTON_ICON_SIZES[size]

	return (
		<button
			type={type}
			className={[
				styles.button,
				styles[variant],
				styles[size],
				fullWidth && styles.fullWidth,
				className,
			]
				.filter(Boolean)
				.join(' ')}
			data-testid={base}
			{...buttonProps}
		>
			{iconStart && (
				<Icon
					name={iconStart}
					size={iconSize}
					dataTestId={`${base}${BUTTON_TESTIDS.ICON_START_SUFFIX}`}
				/>
			)}
			{children}
			{iconEnd && (
				<Icon
					name={iconEnd}
					size={iconSize}
					dataTestId={`${base}${BUTTON_TESTIDS.ICON_END_SUFFIX}`}
				/>
			)}
		</button>
	)
}
