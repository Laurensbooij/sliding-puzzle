import { Icon } from '@components/Icon'
import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react'
import { useId } from 'react'

import styles from './Select.module.css'
import { SELECT_TESTIDS } from './constants'

export interface SelectOption {
	/** Becomes the select's value when this option is chosen. */
	value: string
	/** Visible text of the option. Already localized. */
	label: string
}

export interface SelectProps extends Omit<
	ComponentPropsWithoutRef<'select'>,
	// `multiple` and `size` both turn the control into a list box, which the
	// fixed field height would clip and the chevron would float over rows of.
	// The component owns its single-choice shape the way Icon owns its scale.
	'className' | 'children' | 'multiple' | 'size'
> {
	/** Visible micro-label above the field, and the select's accessible name. */
	label: ReactNode
	/** The list to choose from. Four or more; fewer belongs in a SegmentedControl. */
	options: readonly SelectOption[]
	/** Overrides the BASE testid; the field and chevron testids derive from it. */
	dataTestId?: string
}

/**
 * Single choice from four or more options — art packs, difficulty. For three or
 * fewer use SegmentedControl.
 *
 * A native `<select>` wearing product chrome (ADR-0011): only the closed field
 * is styled, and the option list that opens is the platform's own. That is the
 * design, not a shortcut — it buys the whole keyboard model (arrows, Home/End,
 * typeahead, Escape), the mobile picker, and value announcements for free, none
 * of which a hand-rolled listbox would match.
 *
 * The select itself is the painted box rather than a hidden input under a
 * facade, so the focus ring and the hit target are the browser's own.
 */
export const Select: FC<SelectProps> = ({ label, options, dataTestId, id, ...selectProps }) => {
	const generatedId = useId()
	// A caller-supplied id wins: it may already be referenced by a form's error
	// summary or a `<label for>` elsewhere on the page.
	const fieldId = id ?? generatedId
	const base = dataTestId ?? SELECT_TESTIDS.BASE

	return (
		<div className={styles.root} data-testid={base}>
			<label className={styles.label} htmlFor={fieldId}>
				{label}
			</label>
			<div className={styles.field}>
				<select
					{...selectProps}
					id={fieldId}
					className={styles.select}
					data-testid={`${base}${SELECT_TESTIDS.FIELD_SUFFIX}`}
				>
					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				{/* Decorative: the select already announces itself as a combobox, and
				    the glyph floats above the field so it never eats a click.
				    Figma draws the chevron at 18px, which is off the icon scale
				    (…sm 16 · md 20…); md keeps it on the scale and lands the glyph
				    in the same place, since only the trailing inset is designed. */}
				<Icon
					name="chevron-down"
					size="md"
					className={styles.chevron}
					dataTestId={`${base}${SELECT_TESTIDS.CHEVRON_SUFFIX}`}
				/>
			</div>
		</div>
	)
}
