import { useGameConfig } from '@/lib/game-config'
import type { FC } from 'react'

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
 */
export const PlayRoute: FC = () => {
	const { rows, cols } = useGameConfig()

	return <Game key={`${rows}x${cols}`} rows={rows} cols={cols} />
}
