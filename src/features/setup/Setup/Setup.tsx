import { BOARD_SIZES, isBoardSize, useGameConfig } from '@/lib/game-config'
import { useRecords } from '@/lib/records'
import { Button } from '@components/Button'
import { Icon } from '@components/Icon'
import { SegmentedControl } from '@components/SegmentedControl'
import type { SegmentedControlProps } from '@components/SegmentedControl'
import { createBoard } from '@engine'
import { Message, useTranslate } from '@i18n'
import { Board } from '@widgets/Board'
import type { FC } from 'react'
import { useMemo } from 'react'

import styles from './Setup.module.css'
import { SourceImageChoice } from './components/SourceImageChoice'
import { SETUP_TESTIDS } from './constants'
import { setupMessages } from './translation-messages'

export interface SetupProps {
	/**
	 * Called when the player starts a game. Setup does not know it is mounted at
	 * `/` or that Play is at `/play` — the app tier wires this to a route
	 * (ADR-0017).
	 */
	onStart: () => void
}

/**
 * The screen at `/`: what the game is, what it will look like, and the two
 * choices that decide it.
 *
 * Both choices write straight through to the game config, with no draft state in
 * between. The config means "your last size and artwork", not "the game you are
 * about to start", so the preview board and the record line read back from the
 * provider rather than from anything held here — which is also why a reload
 * reopens Setup exactly as it was left.
 *
 * DOM order is preview → pitch → controls at every width. Desktop's grid places
 * the preview in the right column by area, so the reading order a screen reader
 * follows never changes with the viewport.
 */
export const Setup: FC<SetupProps> = ({ onStart }) => {
	const { rows, cols, sourceImage, setBoardSize, setSourceImage } = useGameConfig()
	const { bestFor } = useRecords()
	const { translate } = useTranslate()

	// Board compares board identity to decide what changed, so a fresh object on
	// every render would make it recompute the diff for a board that never moves.
	const board = useMemo(() => createBoard(rows, cols), [rows, cols])
	const best = bestFor(rows)

	const boardSizeOptions: SegmentedControlProps['options'] = BOARD_SIZES.map((size) => ({
		value: String(size),
		label: translate(setupMessages.boardSizeOption, { size }),
	}))

	const handleBoardSizeChange = (value: string) => {
		const size = Number(value)
		// The control only ever reports a value it was given, so this narrows a
		// string back to the union rather than guarding against real bad input.
		if (isBoardSize(size)) setBoardSize(size)
	}

	return (
		<div className={styles.setup} data-testid={SETUP_TESTIDS.BASE}>
			<div className={styles.preview}>
				<Board
					board={board}
					sourceImage={sourceImage}
					interactive={false}
					label={translate(setupMessages.previewLabel, { size: rows })}
					dataTestId={`${SETUP_TESTIDS.BASE}${SETUP_TESTIDS.PREVIEW_SUFFIX}`}
				/>
			</div>

			<div className={styles.pitch}>
				<h1 className={styles.heading}>
					<Message message={setupMessages.heading} />
				</h1>
				<p className={styles.lede}>
					<Message message={setupMessages.lede} />
				</p>
			</div>

			<div className={styles.controls}>
				<SegmentedControl
					label={translate(setupMessages.boardSizeLabel)}
					labelVisible
					options={boardSizeOptions}
					value={String(rows)}
					onChange={handleBoardSizeChange}
					dataTestId={`${SETUP_TESTIDS.BASE}${SETUP_TESTIDS.BOARD_SIZE_SUFFIX}`}
				/>

				<SourceImageChoice value={sourceImage} onChange={setSourceImage} />

				<div className={styles.cta}>
					<Button
						size="lg"
						iconStart="play"
						onClick={onStart}
						dataTestId={`${SETUP_TESTIDS.BASE}${SETUP_TESTIDS.START_SUFFIX}`}
					>
						<Message message={setupMessages.start} />
					</Button>

					{/* Not a live region: the size that changes it is chosen by a
					    native radio, which the platform announces on its own. */}
					<p
						className={styles.record}
						data-testid={`${SETUP_TESTIDS.BASE}${SETUP_TESTIDS.RECORD_SUFFIX}`}
					>
						<Icon name="trophy" size="sm" className={styles.recordIcon} />
						{best === undefined ? (
							<Message message={setupMessages.recordEmpty} values={{ size: rows }} />
						) : (
							<Message
								message={setupMessages.recordBest}
								values={{ size: rows, moves: best }}
							/>
						)}
					</p>
				</div>
			</div>
		</div>
	)
}
