import { Play } from '@/features/play'
import { gameMachine } from '@machines/game-machine'
import { useActorRef } from '@xstate/react'
import type { FC } from 'react'
import { useEffect } from 'react'

export interface GameProps {
	rows: number
	cols: number
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
 */
export const Game: FC<GameProps> = ({ rows, cols }) => {
	const game = useActorRef(gameMachine, { input: { rows, cols } })

	// Sent from an effect because that is when @xstate/react starts the actor;
	// anything sent earlier waits in its mailbox for the same moment.
	useEffect(() => {
		game.send({ type: 'game.start' })
	}, [game])

	return <Play game={game} />
}
