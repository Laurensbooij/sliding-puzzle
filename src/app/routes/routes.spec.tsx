import { placeholderMessages } from '@/app/placeholders/translation-messages'
import { ROUTES } from '@/lib/routes'
import { createTranslate } from '@i18n'
import { type RenderWithProvidersOptions, renderWithProviders } from '@testing'
import { type RenderResult, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { routes } from './routes'
import { routeMessages } from './translation-messages'

const { translate } = createTranslate()

const renderComponent = (
	initialEntry: string = ROUTES.setup,
	options?: RenderWithProvidersOptions,
): RenderResult =>
	renderWithProviders(
		<RouterProvider router={createMemoryRouter(routes, { initialEntries: [initialEntry] })} />,
		options,
	)

describe('routes', () => {
	it('serves the Setup screen at the root path', () => {
		renderComponent()

		const heading = screen.getByRole('heading', {
			level: 1,
			name: translate(placeholderMessages.setupHeading),
		})

		expect(heading).toBeInTheDocument()
		expect(document.title).toBe(translate(routeMessages.setupTitle))
	})

	it('serves the Play screen at its own path', () => {
		renderComponent(ROUTES.play)

		const heading = screen.getByRole('heading', {
			level: 1,
			name: translate(placeholderMessages.playHeading),
		})

		expect(heading).toBeInTheDocument()
		expect(document.title).toBe(translate(routeMessages.playTitle))
	})

	it('navigates from Setup to Play, retitling and refocusing', async () => {
		const user = userEvent.setup()
		renderComponent()
		const toPlay = screen.getByRole('link', { name: translate(placeholderMessages.toPlay) })

		await user.click(toPlay)

		const heading = screen.getByRole('heading', {
			level: 1,
			name: translate(placeholderMessages.playHeading),
		})
		expect(heading).toHaveFocus()
		expect(document.title).toBe(translate(routeMessages.playTitle))
	})

	it('navigates back from Play to Setup with the keyboard alone', async () => {
		const user = userEvent.setup()
		renderComponent(ROUTES.play)
		const toSetup = screen.getByRole('link', { name: translate(placeholderMessages.toSetup) })

		await user.tab()
		expect(toSetup).toHaveFocus()
		await user.keyboard('{Enter}')

		const heading = screen.getByRole('heading', {
			level: 1,
			name: translate(placeholderMessages.setupHeading),
		})
		expect(heading).toHaveFocus()
		expect(document.title).toBe(translate(routeMessages.setupTitle))
	})

	it('lands an unknown path on Setup', () => {
		renderComponent('/no-such-screen')

		const heading = screen.getByRole('heading', {
			level: 1,
			name: translate(placeholderMessages.setupHeading),
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
			name: translate(placeholderMessages.setupHeading),
		})

		expect(heading).toHaveFocus()
	})
})
