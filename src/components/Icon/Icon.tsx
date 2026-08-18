import { cx } from '@/lib/cx'
import type { FC, SVGProps } from 'react'

import styles from './Icon.module.css'
import { ICON_GLYPHS, ICON_SIZES, ICON_TESTIDS } from './constants'

/** A glyph from the designed Lucide set — see `ICON_GLYPHS`. */
export type IconName = keyof typeof ICON_GLYPHS

/** A step on the icon scale: xs 12 · sm 16 · md 20 · lg 24 · xl 32. */
export type IconSize = (typeof ICON_SIZES)[number]

export interface IconProps extends Omit<
	SVGProps<SVGSVGElement>,
	// The component owns its accessibility contract and its size; leaving
	// these open would let a caller quietly unhide a decorative glyph, or
	// take an icon out of the scale.
	'role' | 'aria-hidden' | 'aria-label' | 'aria-labelledby' | 'tabIndex' | 'width' | 'height'
> {
	/** Which glyph to draw. */
	name: IconName
	/** Step on the icon scale. Defaults to `md` (20px). */
	size?: IconSize
	/** Accessible name. Omit when neighbouring text already carries the meaning. */
	label?: string
	/** Overrides the BASE testid for instances rendered in a collection. */
	dataTestId?: string
}

/**
 * An outline glyph: Lucide, 2px stroke, drawn in `currentColor` so it takes the
 * colour of whatever it sits in.
 *
 * Decorative by default. An icon beside its own label is noise to a screen
 * reader, and that is the common case here — so it is hidden unless the caller
 * passes a `label`, which is what makes it meaningful on its own.
 */
export const Icon: FC<IconProps> = ({
	name,
	size = 'md',
	label,
	className,
	dataTestId,
	...svgProps
}) => {
	const Glyph = ICON_GLYPHS[name]
	const decorative = label === undefined

	return (
		<Glyph
			{...svgProps}
			className={cx(styles.icon, styles[size], className)}
			data-testid={dataTestId ?? ICON_TESTIDS.BASE}
			aria-hidden={decorative || undefined}
			role={decorative ? undefined : 'img'}
			aria-label={label}
		/>
	)
}
