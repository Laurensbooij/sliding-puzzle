import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react'

import styles from './Badge.module.css'
import { BADGE_TESTIDS } from './constants'

export type BadgeTone = 'neutral' | 'accent' | 'amber' | 'danger' | 'inverse'

export interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
	/** Colour treatment. Amber is reward only — wins, streaks, bests; danger is errors only. */
	tone?: BadgeTone
	/** Optional leading glyph, rendered decoratively so the text stays the badge's name. */
	icon?: ReactNode
	/** Overrides the BASE testid for instances rendered in a collection. */
	dataTestId?: string
}

/**
 * A small status or meta pill: uppercase micro-label on a tinted, pill-shaped
 * ground. Static by design — it has no interaction states and takes no focus.
 *
 * Uppercasing is a CSS transform, not a string change, so assistive technology
 * still reads the sentence-case text the consumer passed.
 */
export const Badge: FC<BadgeProps> = ({
	tone = 'neutral',
	icon,
	dataTestId,
	className,
	children,
	...spanProps
}) => {
	const base = dataTestId ?? BADGE_TESTIDS.BASE

	return (
		<span
			className={[styles.badge, styles[tone], className].filter(Boolean).join(' ')}
			data-testid={base}
			{...spanProps}
		>
			{icon && (
				<span
					className={styles.icon}
					data-testid={`${base}${BADGE_TESTIDS.ICON_SUFFIX}`}
					aria-hidden="true"
				>
					{icon}
				</span>
			)}
			{children}
		</span>
	)
}
