import { PLAY_TESTIDS } from '@/features/play'
import { playMessages } from '@/features/play/Play/translation-messages'
import { setupMessages } from '@/features/setup/Setup/translation-messages'
import { GameConfigProvider } from '@/lib/game-config'
import { RecordsProvider } from '@/lib/records'
import { ROUTES } from '@/lib/routes'
import { SettingsProvider } from '@/lib/settings'
import { createTranslate } from '@i18n'
import { type RenderWithProvidersOptions, renderWithProviders } from '@testing'
import { type RenderResult, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { APP_HEADER_TESTIDS } from '@widgets/AppHeader'
import { BOARD_TESTIDS } from '@widgets/Board'
import { SETTINGS_DIALOG_TESTIDS } from '@widgets/SettingsDialog'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { LEAVE_CONFIRMATION_TESTIDS } from './PlayRoute/components/LeaveConfirmation'
import { leaveConfirmationMessages } from './PlayRoute/components/LeaveConfirmation/translation-messages'
import { routes } from './routes'
import { routeMessages } from './translation-messages'

const { translate } = createTranslate()

const LEAVE_TITLE = translate(leaveConfirmationMessages.title)

/**
 * The header's two controls by testid rather than by accessible name: both
 * names come from messages colocated inside the AppHeader widget, and a
 * widget's barrel is its whole public API (ADR-0007). Its own spec is where
 * those names are asserted.
 */
const WORDMARK_TESTID = `${APP_HEADER_TESTIDS.BASE}${APP_HEADER_TESTIDS.WORDMARK_SUFFIX}`
const GEAR_TESTID = `${APP_HEADER_TESTIDS.BASE}${APP_HEADER_TESTIDS.SETTINGS_SUFFIX}`

const leaveConfirmation = (): HTMLElement | null =>
	screen.queryByRole('dialog', { name: LEAVE_TITLE })

const leaveControl = (suffix: string): HTMLElement =>
	screen.getByTestId(`${LEAVE_CONFIRMATION_TESTIDS.BASE}${suffix}`)

/** The read-out that says whether the game underneath survived the question. */
const moveCount = (): HTMLElement =>
	screen.getByTestId(`${PLAY_TESTIDS.BASE}${PLAY_TESTIDS.MOVES_SUFFIX}`)

/** The tiles a press would move — the only buttons the board leaves enabled. */
const firstMovableTile = (): HTMLElement => {
	const tile = screen
		.getAllByRole('button')
		.find((button) => button.getAttribute('aria-disabled') === 'false')
	if (!tile) throw new Error('The board rendered no movable tile')
	return tile
}

/**
 * The providers sit outside the router here exactly as they do in `main.tsx`:
 * the screens read their state from context, not from a loader, so a route test
 * that omits them is testing a tree the app never renders.
 */
const renderComponent = (
	initialEntry: string = ROUTES.setup,
	options?: RenderWithProvidersOptions,
): RenderResult =>
	renderWithProviders(
		<GameConfigProvider>
			<SettingsProvider>
				<RecordsProvider>
					<RouterProvider
						router={createMemoryRouter(routes, { initialEntries: [initialEntry] })}
					/>
				</RecordsProvider>
			</SettingsProvider>
		</GameConfigProvider>,
		options,
	)

describe('routes', () => {
	it('serves the Setup screen at the root path', () => {
		renderComponent()

		const heading = screen.getByRole('heading', {
			level: 1,
			name: translate(setupMessages.heading),
		})

		expect(heading).toBeInTheDocument()
		expect(document.title).toBe(translate(routeMessages.setupTitle))
	})

	/**
	 * The screen's own copy is its spec's business; what the table owes is that
	 * the real Play screen — board and all — is what `/play` mounts.
	 */
	it('serves the Play screen at its own path', () => {
		renderComponent(ROUTES.play)

		const heading = screen.getByRole('heading', { level: 1 })
		const board = screen.getByRole('group')

		expect(heading).toBeInTheDocument()
		expect(board).toBeInTheDocument()
		expect(document.title).toBe(translate(routeMessages.playTitle))
	})

	it('navigates from Setup to Play, retitling and refocusing', async () => {
		const user = userEvent.setup()
		renderComponent()
		const start = screen.getByRole('button', { name: translate(setupMessages.start) })

		await user.click(start)

		const heading = screen.getByRole('heading', { level: 1 })
		expect(heading).toHaveFocus()
		expect(document.title).toBe(translate(routeMessages.playTitle))
	})

	it('navigates from Setup to Play with the keyboard alone', async () => {
		const user = userEvent.setup()
		renderComponent()
		const toPlay = screen.getByRole('button', { name: translate(setupMessages.start) })

		// Past the header's two stops — wordmark, then gear — and the screen's own
		// two radio groups, each one tab stop under the roving-tabindex model.
		await user.tab()
		await user.tab()
		await user.tab()
		await user.tab()
		await user.tab()
		expect(toPlay).toHaveFocus()
		await user.keyboard('{Enter}')

		// The screen's own copy is its spec's business; what the table owes is
		// that Play — the real Play, not this test's own heading — is what
		// mounts, and that it takes focus.
		const heading = screen.getByRole('heading', { level: 1 })
		expect(heading).toHaveFocus()
		expect(document.title).toBe(translate(routeMessages.playTitle))
	})

	it('lands an unknown path on Setup', () => {
		renderComponent('/no-such-screen')

		const heading = screen.getByRole('heading', {
			level: 1,
			name: translate(setupMessages.heading),
		})

		expect(heading).toBeInTheDocument()
		expect(document.title).toBe(translate(routeMessages.setupTitle))
	})

	/**
	 * The one load that moves focus. Landing on an unknown path redirects, which
	 * changes the pathname before anyone has interacted — so the shell treats it
	 * as a navigation. Left that way on purpose: the heading is where someone who
	 * mistyped a URL should end up.
	 */
	it('focuses the Setup heading after redirecting an unknown path', () => {
		renderComponent('/no-such-screen')

		const heading = screen.getByRole('heading', {
			level: 1,
			name: translate(setupMessages.heading),
		})

		expect(heading).toHaveFocus()
	})

	/**
	 * The one navigation the Play screen asks for: it confirms the abandonment
	 * itself and reports it, and the table is what knows that a game given up on
	 * puts the player back on Setup.
	 */
	it('returns to Setup when a game is abandoned', async () => {
		const user = userEvent.setup()
		renderComponent(ROUTES.play)
		const abandon = screen.getByTestId(`${BOARD_TESTIDS.BASE}${BOARD_TESTIDS.ABANDON_SUFFIX}`)

		await user.click(abandon)
		const confirmation = screen.getByRole('dialog', {
			name: translate(playMessages.abandonTitle),
		})
		const confirm = within(confirmation).getByRole('button', {
			name: translate(playMessages.abandonConfirm),
		})
		await user.click(confirm)

		const heading = screen.getByRole('heading', {
			level: 1,
			name: translate(setupMessages.heading),
		})
		expect(heading).toBeInTheDocument()
		expect(document.title).toBe(translate(routeMessages.setupTitle))
	})

	/**
	 * The wordmark is the header's only navigation and so the only in-app
	 * trigger this guard has. It holds the navigation rather than undoing
	 * one — the player is still on their game while the question stands.
	 */
	it('asks before the wordmark takes the player off a game in progress', async () => {
		const user = userEvent.setup()
		renderComponent(ROUTES.play)
		const wordmark = screen.getByTestId(WORDMARK_TESTID)

		await user.click(wordmark)

		const confirmation = leaveConfirmation()
		expect(confirmation).toBeVisible()
		expect(document.title).toBe(translate(routeMessages.playTitle))
	})

	/**
	 * Confirming is what abandons the game: the route unmounts, which stops the
	 * actor. The board going with it is as much of that teardown as the DOM can
	 * be asked to show.
	 */
	it('leaves for Setup once the player confirms, taking the game with it', async () => {
		const user = userEvent.setup()
		renderComponent(ROUTES.play)
		const wordmark = screen.getByTestId(WORDMARK_TESTID)
		await user.click(wordmark)
		const leave = leaveControl(LEAVE_CONFIRMATION_TESTIDS.LEAVE_SUFFIX)

		await user.click(leave)

		const heading = screen.getByRole('heading', {
			level: 1,
			name: translate(setupMessages.heading),
		})
		const board = screen.queryByTestId(BOARD_TESTIDS.BASE)
		expect(heading).toBeInTheDocument()
		expect(board).not.toBeInTheDocument()
		expect(document.title).toBe(translate(routeMessages.setupTitle))
	})

	it('stays on the game, untouched, when the player keeps playing', async () => {
		const user = userEvent.setup()
		renderComponent(ROUTES.play)
		await user.click(firstMovableTile())
		const moves = moveCount()
		const movesPlayed = moves.textContent
		const wordmark = screen.getByTestId(WORDMARK_TESTID)
		await user.click(wordmark)
		const keepPlaying = leaveControl(LEAVE_CONFIRMATION_TESTIDS.KEEP_PLAYING_SUFFIX)

		await user.click(keepPlaying)

		expect(leaveConfirmation()).not.toBeInTheDocument()
		expect(moves.textContent).toBe(movesPlayed)
		expect(document.title).toBe(translate(routeMessages.playTitle))
	})

	/**
	 * The gear opens a dialog over the game rather than navigating, so it is
	 * none of the guard's business — mid-game it stays exactly as live as it is
	 * anywhere else.
	 */
	it('opens Settings mid-game without asking about the game', async () => {
		const user = userEvent.setup()
		renderComponent(ROUTES.play)
		const gear = screen.getByTestId(GEAR_TESTID)

		await user.click(gear)

		const settings = screen.getByTestId(SETTINGS_DIALOG_TESTIDS.BASE)
		expect(settings).toBeVisible()
		expect(leaveConfirmation()).not.toBeInTheDocument()
	})

	/**
	 * The screen asks its own question first and reports the answer, so the
	 * guard lets that navigation past: two cards for one answer would be the
	 * bug.
	 */
	it('asks nothing more when the screen has already confirmed the abandonment', async () => {
		const user = userEvent.setup()
		renderComponent(ROUTES.play)
		const abandon = screen.getByTestId(`${BOARD_TESTIDS.BASE}${BOARD_TESTIDS.ABANDON_SUFFIX}`)
		await user.click(abandon)
		const confirmation = screen.getByRole('dialog', {
			name: translate(playMessages.abandonTitle),
		})

		const confirm = within(confirmation).getByRole('button', {
			name: translate(playMessages.abandonConfirm),
		})

		await user.click(confirm)

		expect(leaveConfirmation()).not.toBeInTheDocument()
		expect(document.title).toBe(translate(routeMessages.setupTitle))
	})
})
