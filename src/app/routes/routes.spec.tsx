import { setupMessages } from '@/features/setup/Setup/translation-messages'
import { GameConfigProvider } from '@/lib/game-config'
import { RecordsProvider } from '@/lib/records'
import { ROUTES } from '@/lib/routes'
import { SettingsProvider } from '@/lib/settings'
import { createTranslate } from '@i18n'
import { type RenderWithProvidersOptions, renderWithProviders } from '@testing'
import { type RenderResult, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { routes } from './routes'
import { routeMessages } from './translation-messages'

const { translate } = createTranslate()

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
})
