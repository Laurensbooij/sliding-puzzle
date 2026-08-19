import type { RouteHandle } from '@/app/routes/types'
import { SettingsProvider } from '@/lib/settings'
import { type TranslationMessage, createTranslate } from '@i18n'
import { globalMessages } from '@messages'
import { type RenderWithProvidersOptions, renderWithProviders } from '@testing'
import { type RenderResult, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { APP_HEADER_TESTIDS } from '@widgets/AppHeader'
import type { FC } from 'react'
import { Link, RouterProvider, createMemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { AppShell } from './AppShell'

const { translate } = createTranslate()

const CLOSE_LABEL = translate(globalMessages.close)

/**
 * The gear by testid rather than by its accessible name: the name comes from a
 * message colocated inside the AppHeader widget, and a widget's barrel is its
 * whole public API (ADR-0007). Its own spec is where that name is asserted.
 */
const GEAR_TESTID = `${APP_HEADER_TESTIDS.BASE}${APP_HEADER_TESTIDS.SETTINGS_SUFFIX}`

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
		// The dialog the shell owns writes through this provider, which the app
		// mounts above the router.
		<SettingsProvider>
			<RouterProvider
				router={createMemoryRouter(specRoutes, { initialEntries: [initialEntry] })}
			/>
		</SettingsProvider>,
		options,
	)

/**
 * WCAG 2.2 AA determinations for AppShell, per docs/conventions/accessibility.md.
 *
 * - Accessible name — the `main` landmark takes none: a document with one `main`
 *   is named by being the only one, and a redundant label would be read on every
 *   screen. Role plus name is carried by each screen's `<h1>`, asserted below.
 * - Keyboard — the shell binds no keys. Its whole operation map is the screen's
 *   own tab order, plus the focus move a route change performs; both are
 *   asserted below.
 * - Focus (SC 2.4.11) — the heading takes a 2px `--focus-ring` outline at a 2px
 *   offset, from `.routeHeading:focus`. Nothing overlays `page-content`, so the
 *   indicator cannot be obscured.
 * - Announcements — N/A as a live region: a route change announces itself by
 *   moving focus to the new heading, asserted below. A second live region saying
 *   the same thing would double-speak.
 * - Target size (SC 2.5.8) — N/A: the shell renders no target of its own. The
 *   header's two are sized in AppHeader and asserted in its spec.
 * - Contrast — N/A here, and deliberately unevidenced: contrast is only
 *   computable in the real-Chromium story project, and this shell ships no
 *   story (it has no designed variant beyond one padding value). The tokens it
 *   paints — `--surface-page` under `--text-body` — are already scanned wherever
 *   a component renders on the page surface. Note `--focus-ring` against
 *   `--surface-page` measures 2.63:1, under SC 1.4.11's 3:1: a known
 *   repo-wide token issue, not one this shell introduces.
 * - Reduced motion — N/A: declares no transition or animation.
 * - Skip link (SC 2.4.1) — N/A: the header holds two focusable elements, which
 *   is not a block of repeated content to bypass.
 */
describe('AppShell', () => {
	it('hosts the routed screen inside the main landmark', () => {
		renderComponent()

		const pageContent = screen.getByRole('main')
		const heading = screen.getByRole('heading', { level: 1, name: 'First screen' })

		expect(pageContent).toContainElement(heading)
	})

	it('mounts the header outside the routed screen', () => {
		renderComponent()

		const banner = screen.getByRole('banner')
		const pageContent = screen.getByRole('main')

		expect(pageContent).not.toContainElement(banner)
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

		// The header owns the first two stops — wordmark, then gear — so the
		// screen's own tab order starts on the third.
		await user.tab()
		await user.tab()
		await user.tab()
		expect(toSecond).toHaveFocus()
		await user.keyboard('{Enter}')

		const heading = screen.getByRole('heading', { level: 1, name: 'Second screen' })
		expect(heading).toHaveFocus()
	})

	it('keeps Settings shut until the gear asks for it', () => {
		renderComponent()

		const settings = screen.queryByRole('dialog')
		expect(settings).not.toBeInTheDocument()
	})

	// Every route, not just the first: the gear is chrome, and a settings surface
	// that came and went per screen would be worse than one that is inert.
	it.each([FIRST_PATH, SECOND_PATH, UNTITLED_PATH])(
		'opens Settings from the gear on %s',
		async (path) => {
			const user = userEvent.setup()
			renderComponent(path)
			const gear = screen.getByTestId(GEAR_TESTID)

			await user.click(gear)

			const settings = screen.getByRole('dialog')
			expect(settings).toBeVisible()
		},
	)

	it('shuts Settings again when its close control is pressed', async () => {
		const user = userEvent.setup()
		renderComponent()
		const gear = screen.getByTestId(GEAR_TESTID)

		await user.click(gear)
		const close = screen.getByRole('button', { name: CLOSE_LABEL })
		await user.click(close)

		const settings = screen.queryByRole('dialog')
		expect(settings).not.toBeInTheDocument()
	})

	it('opens Settings over the screen rather than navigating away from it', async () => {
		const user = userEvent.setup()
		renderComponent()
		const gear = screen.getByTestId(GEAR_TESTID)

		await user.click(gear)

		const heading = screen.getByRole('heading', { level: 1, name: 'First screen' })
		expect(heading).toBeInTheDocument()
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
