import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react'
import { useId } from 'react'

import styles from './Switch.module.css'
import { SWITCH_TESTIDS } from './constants'

export interface SwitchProps extends Omit<
	ComponentPropsWithoutRef<'input'>,
	'type' | 'role' | 'className' | 'children'
> {
	/** The setting being toggled. Becomes the accessible name. */
	label: ReactNode
	/** Supporting copy under the label, tied to the switch as its description. */
	description?: ReactNode
	/** Overrides the BASE testid for instances rendered in a collection. */
	dataTestId?: string
}

/**
 * A boolean setting toggle — sound, numbered hints, timer. For three or more
 * choices use a Select or SegmentedControl instead.
 *
 * A native checkbox carries the semantics and every interaction; `role="switch"`
 * only changes how it is announced (on/off rather than checked). Nothing is
 * reimplemented, so Space toggles and Enter does not, for free.
 *
 * State changes need no live region: `aria-checked` lives on the focused
 * control, so assistive technology announces the flip itself.
 */
export const Switch: FC<SwitchProps> = ({ label, description, dataTestId, ...inputProps }) => {
	const fieldId = useId()
	const labelId = `${fieldId}-label`
	const descriptionId = `${fieldId}-description`
	const base = dataTestId ?? SWITCH_TESTIDS.BASE

	return (
		<label className={styles.root}>
			{/* The knob is positioned against the track, not the row: a label long
			    enough to wrap makes the row taller and the knob would drift. */}
			<span className={styles.control}>
				{/* The input is the track: it is painted, not hidden, so the focus
				    ring and the hit target are the browser's own. */}
				<input
					{...inputProps}
					type="checkbox"
					role="switch"
					className={styles.track}
					data-testid={base}
					aria-labelledby={labelId}
					aria-describedby={description === undefined ? undefined : descriptionId}
				/>
				<span
					className={styles.knob}
					data-testid={`${base}${SWITCH_TESTIDS.KNOB_SUFFIX}`}
				/>
			</span>
			<span className={styles.text}>
				<span className={styles.label} id={labelId}>
					{label}
				</span>
				{description !== undefined && (
					<span className={styles.description} id={descriptionId}>
						{description}
					</span>
				)}
			</span>
		</label>
	)
}
