import { Message } from '@i18n'
import { SOURCE_IMAGES, SOURCE_IMAGE_NAMES } from '@source-images'
import type { SourceImageName } from '@source-images'
import type { FC } from 'react'
import { useId } from 'react'

import styles from './SourceImageChoice.module.css'
import { SOURCE_IMAGE_CHOICE_TESTIDS } from './constants'
import { sourceImageChoiceMessages, sourceImageNameMessages } from './translation-messages'

export interface SourceImageChoiceProps {
	/** The source image currently painted on the board. */
	value: SourceImageName
	/** Called with the newly chosen artwork. */
	onChange: (sourceImage: SourceImageName) => void
	/** Overrides the BASE testid; swatch testids are derived from it. */
	dataTestId?: string
}

/**
 * The six artworks, as one swatch each: a card-sized tile drawing the whole
 * picture, the chosen one ringed in the accent colour.
 *
 * Native radios, the same choice SegmentedControl makes (ADR-0011): the browser
 * supplies the roving-tabindex model — one tab stop on the checked swatch,
 * arrows moving selection and wrapping — and announces the checked state, so
 * nothing here is hand-rolled. The radio is transparent and stretched over its
 * swatch, which keeps the focusable box, the 60px hit target (SC 2.5.8) and the
 * painted border one and the same element.
 *
 * The drawing is `aria-hidden` and the name is a clipped span: a picture of a
 * bicycle has no accessible name of its own, and the player picks by what they
 * see rather than by which file it came from.
 */
export const SourceImageChoice: FC<SourceImageChoiceProps> = ({ value, onChange, dataTestId }) => {
	// Radios group by `name`; a generated one keeps this group and the board-size
	// control from stealing each other's selection.
	const name = useId()
	const base = dataTestId ?? SOURCE_IMAGE_CHOICE_TESTIDS.BASE

	return (
		<fieldset className={styles.group} data-testid={base}>
			<legend className={styles.legend}>
				<Message message={sourceImageChoiceMessages.legend} />
			</legend>
			<div className={styles.swatches}>
				{SOURCE_IMAGE_NAMES.map((sourceImage) => {
					const SourceImage = SOURCE_IMAGES[sourceImage]

					return (
						<label className={styles.swatch} key={sourceImage}>
							<input
								type="radio"
								className={styles.input}
								name={name}
								value={sourceImage}
								checked={sourceImage === value}
								onChange={() => onChange(sourceImage)}
								data-testid={`${base}${SOURCE_IMAGE_CHOICE_TESTIDS.SWATCH_SUFFIX}-${sourceImage}`}
							/>
							<SourceImage className={styles.sourceImage} aria-hidden />
							<span className={styles.name}>
								<Message message={sourceImageNameMessages[sourceImage]} />
							</span>
						</label>
					)
				})}
			</div>
		</fieldset>
	)
}
