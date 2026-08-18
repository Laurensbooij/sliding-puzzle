import { cx } from '@css-utils'
import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react'
import { useId } from 'react'

import styles from './StatCard.module.css'
import { STAT_CARD_TESTIDS } from './constants'

export type StatCardTone = 'neutral' | 'accent' | 'onWood'

// Content comes from `label` and `value`; `children` would be silently dropped
// by the <dt>/<dd> pair, so it is not part of the API.
export interface StatCardProps extends Omit<ComponentPropsWithoutRef<'dl'>, 'children'> {
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
 * term, the value its definition. The value points back at its label with
 * `aria-labelledby`, so a screen reader lands on "Moves, 042" rather than a
 * bare number — `<dl>` itself exposes no role that could carry that name.
 */
export const StatCard: FC<StatCardProps> = ({
	label,
	value,
	icon,
	tone = 'neutral',
	dataTestId,
	className,
	...listProps
}) => {
	const base = dataTestId ?? STAT_CARD_TESTIDS.BASE
	const labelId = useId()

	return (
		<dl
			className={cx(styles.statCard, styles[tone], className)}
			data-testid={base}
			{...listProps}
		>
			<dt
				className={styles.label}
				id={labelId}
				data-testid={`${base}${STAT_CARD_TESTIDS.LABEL_SUFFIX}`}
			>
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
			<dd
				className={styles.value}
				aria-labelledby={labelId}
				data-testid={`${base}${STAT_CARD_TESTIDS.VALUE_SUFFIX}`}
			>
				{value}
			</dd>
		</dl>
	)
}
