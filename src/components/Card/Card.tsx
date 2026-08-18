import { cx } from '@css-utils'
import type { ComponentPropsWithoutRef, FC } from 'react'

import styles from './Card.module.css'
import { CARD_TESTIDS } from './constants'

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps extends ComponentPropsWithoutRef<'section'> {
	/** Inner spacing step: none 0 · sm 16 · md 20 · lg 24. */
	padding?: CardPadding
	/** Lifts the panel onto shadow/2. Chrome never goes past it. */
	raised?: boolean
	/** Overrides the BASE testid for instances rendered in a collection. */
	dataTestId?: string
}

/**
 * A flat white panel: 1px border, large radius, shadow only when raised. Holds
 * grouped content and nothing else — no coloured left borders, no tinted bodies.
 *
 * A `<section>` rather than a `<div>`: pass `aria-label` (or `aria-labelledby`)
 * and it becomes a navigable region; leave it off and it stays generic, which is
 * the right default for a purely visual panel.
 */
export const Card: FC<CardProps> = ({
	padding = 'sm',
	raised = false,
	dataTestId,
	className,
	children,
	...sectionProps
}) => (
	<section
		className={cx(styles.card, styles[padding], raised && styles.raised, className)}
		data-testid={dataTestId ?? CARD_TESTIDS.BASE}
		{...sectionProps}
	>
		{children}
	</section>
)
