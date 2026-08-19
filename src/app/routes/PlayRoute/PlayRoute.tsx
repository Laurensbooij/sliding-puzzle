import { useGameConfig } from '@/lib/game-config'
import { ROUTES } from '@/lib/routes'
import type { FC } from 'react'
import { useNavigate } from 'react-router'

import { Game } from './components/Game'

/**
 * The Play route: a route is where a game begins and ends, so this is where the
 * actor lives (ADR-0017 keeps that decision — and every other one about where
 * the player is — out of `features/play`).
 *
 * Keyed on the board size, so choosing a different size on Setup deals a new
 * game instead of resizing the one in progress. Nothing else on the screen
 * would survive that change anyway: the move count, the clock and the board
 * itself all belong to the size they were dealt at.
 *
 * Abandoning is the other end of the same fact: the screen confirms it and says
 * so, and this is the only place that knows an abandoned game means Setup. The
 * actor needs no teardown of its own — leaving unmounts the route, which stops
 * it. That is also why leaving by any other door is held and asked about first
 * (`useLeaveGuard`, registered a component down beside the actor): every way
 * out of this route destroys the game, so every one of them is confirmed.
 */
export const PlayRoute: FC = () => {
	const { rows, cols } = useGameConfig()
	const navigate = useNavigate()

	return (
		<Game
			key={`${rows}x${cols}`}
			rows={rows}
			cols={cols}
			onAbandon={() => navigate(ROUTES.setup)}
		/>
	)
}
