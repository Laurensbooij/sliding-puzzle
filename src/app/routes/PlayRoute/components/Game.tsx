import { Play } from '@/features/play'
import type { BoardSize } from '@game-config'
import { gameMachine } from '@machines/game-machine'
import { useActorRef, useSelector } from '@xstate/react'
import type { FC } from 'react'
import { useEffect } from 'react'
import type { SnapshotFrom } from 'xstate'

import { useLeaveGuard } from '../hooks/use-leave-guard/use-leave-guard'
import { LeaveConfirmation } from './LeaveConfirmation'

const selectIsPlaying = (snapshot: SnapshotFrom<typeof gameMachine>): boolean =>
	snapshot.matches('playing')

export interface GameProps {
	// The machine keeps bare numbers; this seam is above the config, where the
	// union still narrows a dimension to one Setup actually offers.
	rows: BoardSize
	cols: BoardSize
	/** Forwarded to the screen: where an abandoned game leaves the player. */
	onAbandon: () => void
}

/**
 * One game, from its first shuffle to whatever ends it: the actor is created
 * and started here, and `game.start` follows immediately because there is no
 * screen for a board nobody has dealt yet.
 *
 * The consequence is worth writing down: the machine's `idle` state is
 * unreachable in the running app. It stays in the machine for stories and
 * specs, which do have a reason to hold a board before it is dealt.
 *
 * Split out of `PlayRoute` only so the route can key it on the board size — a
 * component cannot key itself, and the key is what makes a size change deal a
 * new game rather than resize one in progress.
 *
 * The navigation guard is registered here for the same reason the actor is:
 * only this side of the route knows whether a game is still running. It stays
 * on the route's side of the seam either way, which is what keeps react-router
 * out of `features/play` (ADR-0017) — the screen is handed a callback and never
 * learns that leaving is a navigation at all.
 */
export const Game: FC<GameProps> = ({ rows, cols, onAbandon }) => {
	const game = useActorRef(gameMachine, { input: { rows, cols } })
	const isPlaying = useSelector(game, selectIsPlaying)
	// A solved game has nothing left to protect, so the guard stands down the
	// moment the board comes out.
	const guard = useLeaveGuard(isPlaying)

	// Sent from an effect because that is when @xstate/react starts the actor;
	// anything sent earlier waits in its mailbox for the same moment.
	useEffect(() => {
		game.send({ type: 'game.start' })
	}, [game])

	return (
		<>
			{/* The screen has already asked its own question by the time it
			    reports an abandonment, so this one goes past the guard: two cards
			    for one answer is the bug `unguarded` exists to prevent. */}
			<Play game={game} onAbandon={guard.unguarded(onAbandon)} />
			<LeaveConfirmation
				open={guard.asking}
				onLeave={guard.leave}
				onKeepPlaying={guard.keepPlaying}
			/>
		</>
	)
}
