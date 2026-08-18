import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react'

import styles from './StatCard.module.css'
import { STAT_CARD_TESTIDS } from './constants'

export type StatCardTone = 'default' | 'accent' | 'onWood'

export interface StatCardProps extends ComponentPropsWithoutRef<'dl'> {
	/** What the statistic is — rendered as the uppercase micro-label. */
	label: ReactNode
	/** The statistic itself, set in tabular mono so a counter never jitters. */
	value: ReactNode
	/** Optional glyph beside the label, rendered decoratively. */
	icon?: ReactNode
	/** Colour treatment. `onWood` is the only tone allowed on the frame. */
	tone?: StatCardTone
	/** Overrides the BASE testid for instances rendered in a collection. */
	dataTestId?: string
}

/**
 * A read-out for a single game statistic — moves, time, best.
 *
 * Modelled as a description list because that is what it is: the label is the
 * term, the value its definition. That pairing is what assistive technology
 * reads, so the value never arrives as a bare number.
 */
export const StatCard: FC<StatCardProps> = ({
	label,
	value,
	icon,
	tone = 'default',
	dataTestId,
	className,
	...listProps
}) => {
	const base = dataTestId ?? STAT_CARD_TESTIDS.BASE

	return (
		<dl
			className={[styles.statCard, styles[tone], className].filter(Boolean).join(' ')}
			data-testid={base}
			{...listProps}
		>
			<dt className={styles.label} data-testid={`${base}${STAT_CARD_TESTIDS.LABEL_SUFFIX}`}>
				{icon && (
					<span
						className={styles.icon}
						data-testid={`${base}${STAT_CARD_TESTIDS.ICON_SUFFIX}`}
						aria-hidden="true"
					>
						{icon}
					</span>
				)}
				{label}
			</dt>
			<dd className={styles.value} data-testid={`${base}${STAT_CARD_TESTIDS.VALUE_SUFFIX}`}>
				{value}
			</dd>
		</dl>
	)
}
