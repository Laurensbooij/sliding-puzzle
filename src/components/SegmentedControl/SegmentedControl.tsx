import type { FC } from 'react'
import { useId } from 'react'

import styles from './SegmentedControl.module.css'
import { SEGMENTED_CONTROL_TESTIDS } from './constants'

export interface SegmentedControlOption {
	/** Reported to `onChange` when this segment is selected. */
	value: string
	/** Visible text and accessible name of the segment. Already localized. */
	label: string
}

export interface SegmentedControlProps {
	/** Accessible name of the group. Localized by the caller. */
	label: string
	/** Draws `label` as the design's uppercase micro-label above the track. */
	labelVisible?: boolean
	/** The design set draws three and four; more than four belongs in a Select. */
	options: readonly SegmentedControlOption[]
	/** Value of the currently selected option. */
	value: string
	/** Called with the newly selected option's value. */
	onChange: (value: string) => void
	/** Disables every segment at once — the group has no per-segment disabled state. */
	disabled?: boolean
	/** Overrides the BASE testid; segment testids are derived from it. */
	dataTestId?: string
}

/**
 * Inline single-choice control — board dimension, source-image packs. A pill
 * track of segments where the selected one is a raised white pill.
 *
 * Each segment is a native radio (ADR-0011): the browser supplies the whole
 * roving-tabindex keyboard model — one tab stop on the checked segment, arrow
 * keys moving selection and wrapping — and announces the checked state itself,
 * so nothing here is hand-rolled. The radio is not hidden but transparent and
 * stretched over its segment, which keeps the focusable box the same size as
 * the visible target (SC 2.5.8) and lets `:checked` paint the pill.
 */
export const SegmentedControl: FC<SegmentedControlProps> = ({
	label,
	labelVisible = false,
	options,
	value,
	onChange,
	disabled = false,
	dataTestId,
}) => {
	// Radios group by `name`; a generated one keeps two controls on one screen
	// from stealing each other's selection.
	const name = useId()
	const base = dataTestId ?? SEGMENTED_CONTROL_TESTIDS.BASE

	return (
		<fieldset className={styles.group} disabled={disabled} data-testid={base}>
			<legend className={labelVisible ? styles.legendVisible : styles.legend}>{label}</legend>
			<div className={styles.track}>
				{options.map((option) => (
					<label className={styles.segment} key={option.value}>
						<input
							type="radio"
							className={styles.input}
							name={name}
							value={option.value}
							checked={option.value === value}
							onChange={() => onChange(option.value)}
							data-testid={`${base}${SEGMENTED_CONTROL_TESTIDS.SEGMENT_SUFFIX}-${option.value}`}
						/>
						<span className={styles.label}>{option.label}</span>
					</label>
				))}
			</div>
		</fieldset>
	)
}
