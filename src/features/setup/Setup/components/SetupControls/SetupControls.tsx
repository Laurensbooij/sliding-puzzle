import { Button } from '@components/Button'
import { Icon } from '@components/Icon'
import { SegmentedControl } from '@components/SegmentedControl'
import type { SegmentedControlProps } from '@components/SegmentedControl'
import { BOARD_SIZES, isBoardSize, useGameConfig } from '@game-config'
import { Message, useTranslate } from '@i18n'
import { useRecords } from '@records'
import type { FC, Ref } from 'react'
import { useImperativeHandle, useRef } from 'react'

import { setupMessages } from '../../translation-messages'
import { SourceImageChoice } from '../SourceImageChoice'
import styles from './SetupControls.module.css'
import { SETUP_CONTROLS_TESTIDS } from './constants'
import { setupControlsMessages } from './translation-messages'

export interface SetupControlsHandle {
	/** Moves focus to the GRID SIZE control, onto the size currently chosen. */
	focusBoardSize: () => void
}

export interface SetupControlsProps {
	/** Called when the player starts a game — the screen decides where that leads. */
	onStart: () => void
	/** Handle for the crossover focus move. See Setup. */
	ref?: Ref<SetupControlsHandle>
}

/**
 * The two choices that decide the game, and the action that starts it.
 *
 * Exactly one copy of this is mounted at any width: inline on desktop, inside
 * `SetupDialog` on mobile (ADR-0016). Two mounted copies would mean two radio
 * groups, two sets of testids and two tab stops for one choice — which is why
 * the screen branches rather than rendering both and hiding one.
 *
 * Both choices write straight through to the game config, with no draft state
 * in between: the config means "your last size and artwork", so dismissing the
 * dialog discards nothing and there is nothing here to confirm.
 *
 * The record line follows the chosen size and is not a live region — the size
 * is chosen by a native radio, which the platform announces on its own.
 */
export const SetupControls: FC<SetupControlsProps> = ({ onStart, ref }) => {
	const { rows, sourceImage, setBoardSize, setSourceImage } = useGameConfig()
	const { bestFor } = useRecords()
	const { translate } = useTranslate()
	const boardSizeRef = useRef<HTMLDivElement>(null)

	useImperativeHandle(
		ref,
		() => ({
			focusBoardSize: () => {
				// A radio group's checked option is its only tab stop, so this is the
				// element tabbing into the group would reach. Scoped to the size
				// group's own box: the artwork swatches are checked radios too.
				boardSizeRef.current?.querySelector<HTMLInputElement>('input:checked')?.focus()
			},
		}),
		[],
	)

	const best = bestFor(rows)
	const base = SETUP_CONTROLS_TESTIDS.BASE

	const boardSizeOptions: SegmentedControlProps['options'] = BOARD_SIZES.map((size) => ({
		value: String(size),
		label: translate(setupControlsMessages.boardSizeOption, { size }),
	}))

	const handleBoardSizeChange = (value: string) => {
		const size = Number(value)
		// The control only ever reports a value it was given, so this narrows a
		// string back to the union rather than guarding against real bad input.
		if (isBoardSize(size)) setBoardSize(size)
	}

	return (
		<div className={styles.controls} data-testid={base}>
			{/* Box-less wrapper: it exists to scope the crossover focus move to this
			    group, and `display: contents` keeps it out of the layout. */}
			<div className={styles.sizeField} ref={boardSizeRef}>
				<SegmentedControl
					label={translate(setupControlsMessages.boardSizeLabel)}
					labelVisible
					options={boardSizeOptions}
					value={String(rows)}
					onChange={handleBoardSizeChange}
					dataTestId={`${base}${SETUP_CONTROLS_TESTIDS.BOARD_SIZE_SUFFIX}`}
				/>
			</div>

			<SourceImageChoice value={sourceImage} onChange={setSourceImage} />

			<div className={styles.cta}>
				<Button
					size="lg"
					iconStart="play"
					onClick={onStart}
					className={styles.start}
					dataTestId={`${base}${SETUP_CONTROLS_TESTIDS.START_SUFFIX}`}
				>
					<Message message={setupMessages.start} />
				</Button>

				<p
					className={styles.record}
					data-testid={`${base}${SETUP_CONTROLS_TESTIDS.RECORD_SUFFIX}`}
				>
					<Icon name="trophy" size="sm" className={styles.recordIcon} />
					{best === undefined ? (
						<Message
							message={setupControlsMessages.recordEmpty}
							values={{ size: rows }}
						/>
					) : (
						<Message
							message={setupControlsMessages.recordBest}
							values={{ size: rows, moves: best }}
						/>
					)}
				</p>
			</div>
		</div>
	)
}
