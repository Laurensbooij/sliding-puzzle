import { PLAY_TESTIDS } from '@/features/play'
import {
	DEFAULT_GAME_CONFIG,
	GAME_CONFIG_STORAGE_KEY,
	GameConfigProvider,
	useGameConfig,
} from '@/lib/game-config'
import type { BoardSize } from '@/lib/game-config'
import { SettingsProvider } from '@/lib/settings'
import { renderWithProviders, seedStorage } from '@testing'
import type { RenderResult } from '@testing-library/react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FC } from 'react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { PlayRoute } from './PlayRoute'

const SWITCH_SIZE_LABEL = 'Switch to 4×4'
const SWITCHED_SIZE: BoardSize = 4
const NO_MOVES = '00'

/**
 * Stands in for the Setup screen: the one thing that can change the board size
 * while Play is mounted, which is what the route's key exists to answer.
 */
const SizeSwitcher: FC = () => {
	const { setBoardSize } = useGameConfig()

	return (
		<button type="button" onClick={() => setBoardSize(SWITCHED_SIZE)}>
			{SWITCH_SIZE_LABEL}
		</button>
	)
}

const renderComponent = (boardSize: BoardSize = 3): RenderResult => {
	seedStorage({
		[GAME_CONFIG_STORAGE_KEY]: JSON.stringify({ ...DEFAULT_GAME_CONFIG, boardSize }),
	})

	// A data router, not a `MemoryRouter`: the route element navigates when a
	// game is abandoned and holds navigation while one is running, and
	// `useBlocker` exists only on the data routers. Where these navigations land
	// is the table's business, and `routes.spec.tsx` is where it is asserted.
	const router = createMemoryRouter([
		{
			path: '*',
			element: (
				<>
					<PlayRoute />
					<SizeSwitcher />
				</>
			),
		},
	])

	return renderWithProviders(
		<GameConfigProvider>
			<SettingsProvider>
				<RouterProvider router={router} />
			</SettingsProvider>
		</GameConfigProvider>,
	)
}

/** The tiles a press would move — the only buttons the board leaves enabled. */
const firstMovableTile = (): HTMLElement => {
	const tile = screen
		.getAllByRole('button')
		.find((button) => button.getAttribute('aria-disabled') === 'false')
	if (!tile) throw new Error('The board rendered no movable tile')
	return tile
}

const moveCount = (): HTMLElement =>
	screen.getByTestId(`${PLAY_TESTIDS.BASE}${PLAY_TESTIDS.MOVES_SUFFIX}`)

describe('PlayRoute', () => {
	/**
	 * Creation and start are one act. A machine sitting in `idle` ignores
	 * `cell.press`, so a board that answers one is a board that was dealt — which
	 * is as much of the shuffle as this route can be asked to prove.
	 */
	it('deals and starts the game on mount, so the first press already counts', async () => {
		const user = userEvent.setup()
		renderComponent()
		const tile = firstMovableTile()

		await user.click(tile)

		const moves = moveCount()
		expect(moves).not.toHaveTextContent(NO_MOVES)
	})

	/**
	 * The deal lands one render after the board mounts, so the Board sees its
	 * whole arrangement change — which is a replacement, not a run of moves, and
	 * must not reach the live region as one.
	 */
	it('says nothing about the deal that put the board on screen', () => {
		renderComponent()

		const announcer = screen.getByRole('status')
		expect(announcer.textContent).toBe('')
	})

	/**
	 * The actor is keyed on the board size, so changing it remounts rather than
	 * reconfigures: the move count, the clock and the board all belong to the
	 * size they were dealt at.
	 */
	it('deals a new game when the board size changes under it', async () => {
		const user = userEvent.setup()
		renderComponent()
		await user.click(firstMovableTile())
		const movesPlayed = moveCount()
		expect(movesPlayed).not.toHaveTextContent(NO_MOVES)
		const sizeSwitch = screen.getByRole('button', { name: SWITCH_SIZE_LABEL })

		await user.click(sizeSwitch)

		const movesAfterSwitch = moveCount()
		expect(movesAfterSwitch).toHaveTextContent(NO_MOVES)
	})
})
