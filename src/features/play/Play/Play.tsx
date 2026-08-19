import { useGameConfig } from '@/lib/game-config'
import { useSettings } from '@/lib/settings'
import { Icon } from '@components/Icon'
import { StatCard } from '@components/StatCard'
import { cx } from '@css-utils'
import type { CellIndex } from '@engine'
import { Message } from '@i18n'
import type { gameMachine } from '@machines/game-machine'
import { elapsedMs } from '@machines/game-machine'
import { Board } from '@widgets/Board'
import { useSelector } from '@xstate/react'
import type { FC } from 'react'
import type { ActorRefFrom, SnapshotFrom } from 'xstate'

import styles from './Play.module.css'
import { PLAY_TESTIDS } from './constants'
import { useElapsedTick } from './hooks/use-elapsed-tick/use-elapsed-tick'
import { playMessages } from './translation-messages'
import { formatElapsedTime, formatMoveCount } from './utils/format-stats/format-stats'

type GameSnapshot = SnapshotFrom<typeof gameMachine>

/*
 * The whole context rather than the numbers read off it. Its identity changes
 * exactly when the machine assigns, and `elapsedMs` has to be re-derived on
 * every render the tick forces — which a selector's memoised result never
 * would be.
 */
const selectContext = (snapshot: GameSnapshot): GameSnapshot['context'] => snapshot.context

const selectIsPlaying = (snapshot: GameSnapshot): boolean => snapshot.matches('playing')

export interface PlayProps {
	/**
	 * The game on screen. Created and started by the route that mounts this
	 * screen, and keyed there on the board size — so Play only ever consumes
	 * one, and never has to reconcile a game with a size it was not dealt at.
	 */
	game: ActorRefFrom<typeof gameMachine>
}

/**
 * The Play screen: four read-outs above the board being played.
 *
 * This is where logic and presentation meet (ADR-0012) — the machine owns the
 * lifecycle, the Board draws it, and everything between them lives here.
 *
 * Keyboard operation is the Board's, unchanged and asserted in full in its own
 * spec: Tab reaches the movable tiles and then the two footer controls, Space
 * and Enter press the focused tile, and the arrows name the tile that travels
 * that way (ADR-0014). Nothing on this screen claims a key of its own.
 *
 * The Time card deliberately never announces. It changes once a second, and a
 * live region on that beat is unusable noise; the value stays in the
 * accessibility tree, where StatCard's `aria-labelledby` reads it as "Time,
 * 01:18" whenever it is asked for.
 */
export const Play: FC<PlayProps> = ({ game }) => {
	const { rows, cols, sourceImage } = useGameConfig()
	const { showTimer } = useSettings()
	const context = useSelector(game, selectContext)
	const isPlaying = useSelector(game, selectIsPlaying)

	// The only reason a clock exists at all — which is why it stops the moment
	// the card it feeds is hidden, or the game stops running.
	useElapsedTick(isPlaying && showTimer)

	const handleCellPress = (cell: CellIndex) => game.send({ type: 'cell.press', cell })
	const handleRestart = () => game.send({ type: 'game.restart' })

	return (
		<div className={styles.play} data-testid={PLAY_TESTIDS.BASE}>
			<h1 className={styles.heading}>
				<Message message={playMessages.heading} />
			</h1>
			<div
				className={cx(styles.stats, !showTimer && styles.withoutTimer)}
				data-testid={`${PLAY_TESTIDS.BASE}${PLAY_TESTIDS.STATS_SUFFIX}`}
			>
				<StatCard
					label={<Message message={playMessages.movesLabel} />}
					value={formatMoveCount(context.moveCount)}
					icon={<Icon name="footprints" size="xs" />}
					dataTestId={`${PLAY_TESTIDS.BASE}${PLAY_TESTIDS.MOVES_SUFFIX}`}
				/>
				{showTimer && (
					<StatCard
						label={<Message message={playMessages.timeLabel} />}
						value={formatElapsedTime(elapsedMs(context))}
						icon={<Icon name="timer" size="xs" />}
						dataTestId={`${PLAY_TESTIDS.BASE}${PLAY_TESTIDS.TIME_SUFFIX}`}
					/>
				)}
				<StatCard
					label={<Message message={playMessages.bestLabel} />}
					// An em dash at the plain tone, not a record: nothing writes one
					// yet. The accent-tinted card the Solved frame draws arrives with
					// the records that would fill it.
					value={<Message message={playMessages.bestUnset} />}
					icon={<Icon name="trophy" size="xs" />}
					tone="neutral"
					dataTestId={`${PLAY_TESTIDS.BASE}${PLAY_TESTIDS.BEST_SUFFIX}`}
				/>
				<StatCard
					label={<Message message={playMessages.boardSizeLabel} />}
					value={
						<Message message={playMessages.boardSizeValue} values={{ rows, cols }} />
					}
					icon={<Icon name="grid-3x3" size="xs" />}
					dataTestId={`${PLAY_TESTIDS.BASE}${PLAY_TESTIDS.BOARD_SIZE_SUFFIX}`}
				/>
			</div>
			<div className={styles.boardArea}>
				<Board
					board={context.board}
					sourceImage={sourceImage}
					onCellPress={handleCellPress}
					onRestart={handleRestart}
					footer
					// Hard on until the Reference image setting reaches the Board,
					// which arrives with the numbered-tiles half of the same job.
					preview
				/>
			</div>
		</div>
	)
}
