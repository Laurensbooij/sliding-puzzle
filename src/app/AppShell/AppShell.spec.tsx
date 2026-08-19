import { type TranslationMessage, createTranslate } from '@i18n'
import { type RenderWithProvidersOptions, renderWithProviders } from '@testing'
import { type RenderResult, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FC } from 'react'
import { Link, RouterProvider, createMemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import type { RouteHandle } from '../routes/types'
import { AppShell } from './AppShell'
import { APP_SHELL_TESTIDS } from './constants'

const { translate } = createTranslate()

const FIRST_PATH = '/first'
const SECOND_PATH = '/second'
const UNTITLED_PATH = '/untitled'

/**
 * Fixture messages, deliberately not `defineMessages`: the extractor matches
 * that callee name across `src/**` including specs, and a stub title has no
 * business in the shipped catalogues. Under the default locale react-intl
 * resolves an unknown id to its `defaultMessage` without complaining.
 */
const firstTitle: TranslationMessage = {
	id: 'appShell.spec.firstTitle',
	defaultMessage: 'First · Sliding Puzzle',
}

const secondTitle: TranslationMessage = {
	id: 'appShell.spec.secondTitle',
	defaultMessage: 'Second · Sliding Puzzle',
}

/**
 * Stub screens rather than the real ones: this spec is about what the shell
 * does to whatever it hosts, so a screen needs only a heading and a way out.
 */
const FirstScreen: FC = () => (
	<>
		<h1>First screen</h1>
		<Link to={SECOND_PATH}>To second</Link>
		<Link to={UNTITLED_PATH}>To untitled</Link>
	</>
)

const SecondScreen: FC = () => (
	<>
		<h1>Second screen</h1>
		<Link to={FIRST_PATH}>To first</Link>
	</>
)

/** A screen with neither a handle nor a heading — the shell's two fallbacks. */
const UntitledScreen: FC = () => <Link to={FIRST_PATH}>To first</Link>

const specRoutes = [
	{
		Component: AppShell,
		children: [
			{
				path: FIRST_PATH,
				Component: FirstScreen,
				handle: { title: firstTitle } satisfies RouteHandle,
			},
			{
				path: SECOND_PATH,
				Component: SecondScreen,
				handle: { title: secondTitle } satisfies RouteHandle,
			},
			{ path: UNTITLED_PATH, Component: UntitledScreen },
		],
	},
]

const renderComponent = (
	initialEntry: string = FIRST_PATH,
	options?: RenderWithProvidersOptions,
): RenderResult =>
	renderWithProviders(
		<RouterProvider
			router={createMemoryRouter(specRoutes, { initialEntries: [initialEntry] })}
		/>,
		options,
	)

describe('AppShell', () => {
	it('hosts the routed screen inside the main landmark', () => {
		renderComponent()

		const pageContent = screen.getByRole('main')
		const heading = screen.getByRole('heading', { level: 1, name: 'First screen' })

		expect(pageContent).toContainElement(heading)
		expect(pageContent).toHaveAttribute(
			'data-testid',
			`${APP_SHELL_TESTIDS.BASE}${APP_SHELL_TESTIDS.PAGE_CONTENT_SUFFIX}`,
		)
	})

	it('titles the document from the matched route', () => {
		renderComponent()

		expect(document.title).toBe(translate(firstTitle))
	})

	it('retitles the document on navigation', async () => {
		const user = userEvent.setup()
		renderComponent()
		const toSecond = screen.getByRole('link', { name: 'To second' })

		await user.click(toSecond)

		expect(document.title).toBe(translate(secondTitle))
	})

	it('leaves the document title alone for a route that declares none', () => {
		document.title = 'Untouched'

		renderComponent(UNTITLED_PATH)

		expect(document.title).toBe('Untouched')
	})

	it('leaves focus at the document start on first paint', () => {
		renderComponent()

		const heading = screen.getByRole('heading', { level: 1, name: 'First screen' })

		expect(heading).not.toHaveFocus()
		expect(document.body).toHaveFocus()
	})

	it('moves focus to the new screen heading after navigating', async () => {
		const user = userEvent.setup()
		renderComponent()
		const toSecond = screen.getByRole('link', { name: 'To second' })

		await user.click(toSecond)

		const heading = screen.getByRole('heading', { level: 1, name: 'Second screen' })
		expect(heading).toHaveFocus()
		// Programmatically focusable, never a tab stop.
		expect(heading).toHaveAttribute('tabindex', '-1')
	})

	it('follows a link with the keyboard and lands on the new heading', async () => {
		const user = userEvent.setup()
		renderComponent()
		const toSecond = screen.getByRole('link', { name: 'To second' })

		await user.tab()
		expect(toSecond).toHaveFocus()
		await user.keyboard('{Enter}')

		const heading = screen.getByRole('heading', { level: 1, name: 'Second screen' })
		expect(heading).toHaveFocus()
	})

	it('moves focus nowhere when the new screen has no heading', async () => {
		const user = userEvent.setup()
		renderComponent()
		const toUntitled = screen.getByRole('link', { name: 'To untitled' })

		await user.click(toUntitled)

		const remainingLink = screen.getByRole('link', { name: 'To first' })
		expect(remainingLink).not.toHaveFocus()
		expect(document.body).toHaveFocus()
	})
})
