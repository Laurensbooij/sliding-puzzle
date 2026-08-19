import type { BoardSize } from '@/lib/game-config'
import { createTranslate } from '@i18n'
import { renderWithProviders } from '@testing'
import type { RenderResult } from '@testing-library/react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Solved } from './Solved'
import type { SolvedProps } from './Solved'
import { SOLVED_TESTIDS } from './constants'
import { solvedMessages } from './translation-messages'

const { translate } = createTranslate()

const SECOND_MS = 1000

const renderComponent = (props: Partial<SolvedProps> = {}): RenderResult =>
	renderWithProviders(
		<Solved
			open
			moveCount={42}
			elapsed={78 * SECOND_MS}
			boardSize={3}
			isNewBest={false}
			onPlayAgain={vi.fn()}
			onTryNextSize={vi.fn()}
			onClose={vi.fn()}
			{...props}
		/>,
	)

const titleFor = (count: number): string => translate(solvedMessages.title, { count })

const tryNextSizeName = (size: BoardSize): string => translate(solvedMessages.tryNextSize, { size })

/**
 * WCAG 2.2 AA determinations for the win card, per
 * docs/conventions/accessibility.md. Everything structural is the Dialog's and
 * asserted in its own spec; what this component owes is that it composes the
 * card with a name, a description and two operable actions.
 *
 * - **Accessible name** — the title, asserted below.
 * - **Keyboard** — the whole map is asserted below: focus lands on the card,
 *   Tab walks the two actions in the designed order, Enter activates the
 *   focused one, and Escape closes. Focus starting on the card rather than the
 *   primary action is what keeps a stray Enter from starting a game. The focus
 *   *trap* around all of that is `showModal()`'s and Chromium's — the jsdom
 *   shim has none — so the stories are what prove Tab never leaves the card.
 * - **Focus (SC 2.4.11)** — carried by the Dialog and its Buttons, and shown in
 *   the `FocusedActions` story there. jsdom paints nothing.
 * - **Announcements** — **N/A, deliberately.** The card *is* the announcement:
 *   focus lands on it and reads "Solved in 42 moves. A new best at 3×3.
 *   Finished in 01:18." — the record is spoken here and nowhere else, which is
 *   why the Best read-out behind it stays silent (`Play.spec.tsx`). It is
 *   not also pushed through the Board's `role="status"` region, which reports
 *   moves — asserted from the screen in `Play.spec.tsx`, where both exist.
 * - **Target size (SC 2.5.8)** — Button's, 40px at the default step, scanned by
 *   the `target-size` axe rule over the stories.
 * - **Contrast and reduced motion** — Chromium-only, accepted through the
 *   stories.
 */
describe('Solved', () => {
	it('names itself with the move count, pluralised', () => {
		renderComponent({ moveCount: 42 })

		const card = screen.getByRole('dialog', { name: titleFor(42) })
		expect(card).toBeVisible()
	})

	it('counts a single move in the singular', () => {
		renderComponent({ moveCount: 1 })

		const card = screen.getByRole('dialog', { name: titleFor(1) })
		expect(card).toBeVisible()
	})

	it('describes the win with the elapsed time, as the Time card formats it', () => {
		renderComponent({ elapsed: 78 * SECOND_MS })

		const card = screen.getByRole('dialog', { name: titleFor(42) })
		expect(card).toHaveAccessibleDescription(
			translate(solvedMessages.description, { time: '01:18' }),
		)
	})

	it('adds the record line above the time when the game set one', () => {
		renderComponent({ boardSize: 3, elapsed: 78 * SECOND_MS, isNewBest: true })

		const card = screen.getByRole('dialog', { name: titleFor(42) })
		const recordLine = translate(solvedMessages.newBest, { size: 3 })
		const timeLine = translate(solvedMessages.description, { time: '01:18' })
		expect(card).toHaveAccessibleDescription(`${recordLine} ${timeLine}`)
	})

	// The fallback is permanent (SLI-44): the record line is the addition, and a
	// game that beat nothing still says how long it took.
	it('keeps the time line to itself when the game beat nothing', () => {
		renderComponent({ boardSize: 3, elapsed: 78 * SECOND_MS })

		const card = screen.getByRole('dialog', { name: titleFor(42) })
		const newBestLine = screen.queryByText(translate(solvedMessages.newBest, { size: 3 }))
		expect(card).toHaveAccessibleDescription(
			translate(solvedMessages.description, { time: '01:18' }),
		)
		expect(newBestLine).not.toBeInTheDocument()
	})

	it('stays closed while the game is unsolved', () => {
		renderComponent({ open: false })

		const card = screen.queryByRole('dialog')
		expect(card).not.toBeInTheDocument()
	})

	it('deals a new board at the same size when Play again is pressed', async () => {
		const user = userEvent.setup()
		const onPlayAgain = vi.fn()
		renderComponent({ onPlayAgain })
		const playAgain = screen.getByRole('button', { name: translate(solvedMessages.playAgain) })

		await user.click(playAgain)

		expect(onPlayAgain).toHaveBeenCalledTimes(1)
	})

	describe('the next size up', () => {
		it.each<[BoardSize, BoardSize]>([
			[3, 4],
			[4, 5],
			[5, 6],
		])('offers %i×%i a game one size larger', async (boardSize, expected) => {
			const user = userEvent.setup()
			const onTryNextSize = vi.fn()
			renderComponent({ boardSize, onTryNextSize })
			const trySize = screen.getByRole('button', { name: tryNextSizeName(expected) })

			await user.click(trySize)

			expect(onTryNextSize).toHaveBeenCalledWith(expected)
		})

		// The rule that keeps the action row whole; see `nextBoardSize`.
		it('wraps the largest board back to the smallest', async () => {
			const user = userEvent.setup()
			const onTryNextSize = vi.fn()
			renderComponent({ boardSize: 6, onTryNextSize })
			const trySize = screen.getByRole('button', { name: tryNextSizeName(3) })

			await user.click(trySize)

			expect(onTryNextSize).toHaveBeenCalledWith(3)
		})
	})

	describe('keyboard', () => {
		it('lands focus on the card, so its title and description are read first', () => {
			renderComponent()

			const card = screen.getByRole('dialog', { name: titleFor(42) })
			expect(card).toHaveFocus()
		})

		it('reaches both actions with Tab, in the designed order', async () => {
			const user = userEvent.setup()
			renderComponent()

			await user.tab()

			const playAgain = screen.getByRole('button', {
				name: translate(solvedMessages.playAgain),
			})
			expect(playAgain).toHaveFocus()

			await user.tab()

			const trySize = screen.getByRole('button', { name: tryNextSizeName(4) })
			expect(trySize).toHaveFocus()
		})

		it('activates the focused action with Enter', async () => {
			const user = userEvent.setup()
			const onPlayAgain = vi.fn()
			renderComponent({ onPlayAgain })
			await user.tab()

			await user.keyboard('{Enter}')

			expect(onPlayAgain).toHaveBeenCalledTimes(1)
		})
	})

	it('asks to close on Escape, so the solved board can be looked at', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()
		renderComponent({ onClose })

		await user.keyboard('{Escape}')

		expect(onClose).toHaveBeenCalledTimes(1)
	})

	it('gives both actions a testid, so the pair stays addressable', () => {
		renderComponent()

		const playAgain = screen.getByTestId(
			`${SOLVED_TESTIDS.BASE}${SOLVED_TESTIDS.PLAY_AGAIN_SUFFIX}`,
		)
		const trySize = screen.getByTestId(
			`${SOLVED_TESTIDS.BASE}${SOLVED_TESTIDS.TRY_NEXT_SIZE_SUFFIX}`,
		)
		expect(playAgain).toBeVisible()
		expect(trySize).toBeVisible()
	})
})
