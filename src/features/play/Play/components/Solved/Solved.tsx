import { Button } from '@components/Button'
import { Dialog } from '@components/Dialog'
import type { BoardSize } from '@game-config'
import { Message } from '@i18n'
import type { FC } from 'react'

import { formatElapsedTime } from '../../utils/format-stats/format-stats'
import { SOLVED_TESTIDS } from './constants'
import { solvedMessages } from './translation-messages'
import { nextBoardSize } from './utils/next-board-size/next-board-size'

export interface SolvedProps {
	/** Whether the card is showing. Its game being solved is not enough — see Play. */
	open: boolean
	/** Tiles relocated over the whole game, as the title counts them. */
	moveCount: number
	/** Milliseconds the game took, formatted here the way the Time card formats it. */
	elapsed: number
	/** The size just solved. The second action offers the one above it. */
	boardSize: BoardSize
	/**
	 * Whether the solve just recorded is a record at that size. Adds a line to
	 * the description — it never replaces the time. Stated rather than
	 * defaulted: a caller that forgets it would silently swallow the record.
	 */
	isNewBest: boolean
	/** Deal a new board at the size just solved. */
	onPlayAgain: () => void
	/** Start a game at the size named by the second action, which it is called with. */
	onTryNextSize: (boardSize: BoardSize) => void
	/** Asked to close: Escape. Both actions leave by starting a game instead. */
	onClose: () => void
}

/**
 * The win card: what the game says once the board comes out solved.
 *
 * The description carries the elapsed time always, and Figma's "A new best at
 * 3×3." above it when the solve earned one — the time line is the permanent
 * fallback under a line that only holds when the game actually beat something
 * (SLI-44). Both are one paragraph, which is the card's whole announcement:
 * focus lands here and reads the title and then the description.
 *
 * Both actions start a game, which is what leaves the card: one at the size
 * just solved, one at the size above it. Escape is the third way out and the
 * only one that doesn't deal a board — it closes to the solved board behind,
 * which the mobile Solved frame draws as a destination of its own.
 *
 * Accessibility is the Dialog's: the card takes focus on arrival and reads its
 * own title and description, which is the whole announcement this screen makes
 * about the win. Nothing here is pushed through the Board's live region — that
 * region reports moves, and saying it twice is worse than saying it once.
 */
export const Solved: FC<SolvedProps> = ({
	open,
	moveCount,
	elapsed,
	boardSize,
	isNewBest,
	onPlayAgain,
	onTryNextSize,
	onClose,
}) => {
	const nextSize = nextBoardSize(boardSize)

	return (
		<Dialog
			open={open}
			kind="win"
			title={<Message message={solvedMessages.title} values={{ count: moveCount }} />}
			description={
				<>
					{isNewBest && (
						<>
							<Message
								message={solvedMessages.newBest}
								values={{ size: boardSize }}
							/>{' '}
						</>
					)}
					<Message
						message={solvedMessages.description}
						values={{ time: formatElapsedTime(elapsed) }}
					/>
				</>
			}
			onClose={onClose}
			dataTestId={SOLVED_TESTIDS.BASE}
			actions={
				<>
					<Button
						variant="primary"
						iconStart="rotate-ccw"
						onClick={onPlayAgain}
						dataTestId={`${SOLVED_TESTIDS.BASE}${SOLVED_TESTIDS.PLAY_AGAIN_SUFFIX}`}
					>
						<Message message={solvedMessages.playAgain} />
					</Button>
					<Button
						variant="ghost"
						onClick={() => onTryNextSize(nextSize)}
						dataTestId={`${SOLVED_TESTIDS.BASE}${SOLVED_TESTIDS.TRY_NEXT_SIZE_SUFFIX}`}
					>
						<Message message={solvedMessages.tryNextSize} values={{ size: nextSize }} />
					</Button>
				</>
			}
		/>
	)
}
