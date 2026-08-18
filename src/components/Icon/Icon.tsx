import type { FC } from 'react'

import styles from './Icon.module.css'
import { ICON_GLYPHS, ICON_TESTIDS } from './constants'

/** A glyph from the designed Lucide set — see `ICON_GLYPHS`. */
export type IconName = keyof typeof ICON_GLYPHS

/** A step on the design's icon scale, 14–32px. */
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface IconProps {
	/** Which glyph to draw. */
	name: IconName
	/** Step on the icon scale. Defaults to `md` (20px). */
	size?: IconSize
	/** Accessible name. Omit when neighbouring text already carries the meaning. */
	label?: string
	/** Extra class, e.g. to colour the glyph. */
	className?: string
	/** Overrides the BASE testid for instances rendered in a collection. */
	dataTestId?: string
}

/**
 * An outline glyph: Lucide, 2px stroke, drawn in `currentColor` so it takes the
 * colour of whatever it sits in.
 *
 * Decorative by default. An icon beside its own label is noise to a screen
 * reader, and that is the common case here — so it is hidden unless the caller
 * passes a `label`, which is the one thing that makes it meaningful on its own.
 *
 * Deliberately not spreading `SVGProps`: hiding-vs-naming is the whole
 * accessibility contract, and a spread would let a caller reopen it by accident.
 */
export const Icon: FC<IconProps> = ({ name, size = 'md', label, className, dataTestId }) => {
	const Glyph = ICON_GLYPHS[name]
	const decorative = label === undefined

	return (
		<Glyph
			className={className ? `${styles.icon} ${className}` : styles.icon}
			data-size={size}
			data-testid={dataTestId ?? ICON_TESTIDS.BASE}
			aria-hidden={decorative || undefined}
			role={decorative ? undefined : 'img'}
			aria-label={label}
		/>
	)
}
