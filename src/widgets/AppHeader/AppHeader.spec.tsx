import { ROUTES } from '@/lib/routes'
import { createTranslate } from '@i18n'
import { globalMessages } from '@messages'
import { type RenderWithProvidersOptions, renderWithProviders } from '@testing'
import { type RenderResult, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Outlet, RouterProvider, createMemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { AppHeader, type AppHeaderProps } from './AppHeader'
import { appHeaderMessages } from './translation-messages'

const { translate } = createTranslate()

const APP_NAME = translate(globalMessages.appName)
const SETTINGS_LABEL = translate(appHeaderMessages.settings)

/** Stub screens: this spec is about the chrome, so a screen needs only a name. */
const SETUP_HEADING = 'Setup screen'
const PLAY_HEADING = 'Play screen'

const renderComponent = (
	props: Partial<AppHeaderProps> = {},
	initialEntry: string = ROUTES.setup,
	options?: RenderWithProvidersOptions,
): RenderResult =>
	renderWithProviders(
		<RouterProvider
			router={createMemoryRouter(
				[
					{
						// A layout route so the header survives the navigation it
						// triggers, exactly as it does under AppShell.
						element: (
							<>
								<AppHeader onOpenSettings={() => undefined} {...props} />
								<Outlet />
							</>
						),
						children: [
							{ path: ROUTES.setup, element: <h1>{SETUP_HEADING}</h1> },
							{ path: ROUTES.play, element: <h1>{PLAY_HEADING}</h1> },
						],
					},
				],
				{ initialEntries: [initialEntry] },
			)}
		/>,
		options,
	)

/**
 * WCAG 2.2 AA determinations for AppHeader, per docs/conventions/accessibility.md.
 *
 * - Accessible name — the `banner` landmark takes none: a document with one
 *   banner is named by being the only one. Both controls carry theirs and both
 *   are asserted below: the wordmark link is named by the app name it renders,
 *   the gear by its `label` (icon-only, so the name is the whole contract).
 * - Keyboard — the full operation map is two tab stops in reading order, Enter
 *   on the link, Enter and Space on the button. All asserted below.
 * - Focus (SC 2.4.11) — the wordmark takes a 2px `--focus-ring` outline at a 2px
 *   offset, the gear the one IconButton draws. Nothing overlays the header and
 *   nothing clips it, so neither indicator can be obscured.
 * - Current route — conveyed with `aria-current="page"` on the wordmark while
 *   Setup is the route, and only then. Asserted both ways below. It is
 *   deliberately invisible: the design gives the wordmark no active state.
 * - Announcements — N/A: the header holds no state that changes. The gear opens
 *   a dialog, and the dialog announces itself.
 * - Target size (SC 2.5.8) — the gear is 40px square. The wordmark stretches to
 *   the row's 40px rather than the height of its own text, so it clears the
 *   24px floor on its own rather than through the spacing exception.
 * - Contrast — carried by the stories, which is where real Chromium can compute
 *   it: `--teal-800` wordmark and `--text-body` gear on `--surface-page`.
 * - Reduced motion — N/A: declares no transition or animation of its own.
 * - Skip link (SC 2.4.1) — N/A: two focusable elements are not a block of
 *   repeated content to bypass.
 */
describe('AppHeader', () => {
	it('links the wordmark home under the app name', () => {
		renderComponent()

		const wordmark = screen.getByRole('link', { name: APP_NAME })

		expect(wordmark).toHaveAttribute('href', ROUTES.setup)
	})

	it('names the gear for a user who cannot see it', () => {
		renderComponent()

		const settings = screen.getByRole('button', { name: SETTINGS_LABEL })

		expect(settings).toBeInTheDocument()
	})

	it('renders the gear as the only nav control', () => {
		renderComponent()

		const controls = screen.getAllByRole('button')

		expect(controls).toHaveLength(1)
		expect(controls[0]).toHaveAccessibleName(SETTINGS_LABEL)
	})

	it('holds both controls inside the banner landmark', () => {
		renderComponent()

		const banner = screen.getByRole('banner')
		const wordmark = screen.getByRole('link', { name: APP_NAME })
		const settings = screen.getByRole('button', { name: SETTINGS_LABEL })

		expect(banner).toContainElement(wordmark)
		expect(banner).toContainElement(settings)
	})

	it('reports the wordmark as the current page on the setup route', () => {
		renderComponent({}, ROUTES.setup)

		const wordmark = screen.getByRole('link', { name: APP_NAME })

		expect(wordmark).toHaveAttribute('aria-current', 'page')
	})

	it('reports no current page from another route', () => {
		renderComponent({}, ROUTES.play)

		const wordmark = screen.getByRole('link', { name: APP_NAME })

		expect(wordmark).not.toHaveAttribute('aria-current')
	})

	it('asks for settings when the gear is pressed', async () => {
		const user = userEvent.setup()
		const onOpenSettings = vi.fn()
		renderComponent({ onOpenSettings })
		const settings = screen.getByRole('button', { name: SETTINGS_LABEL })

		await user.click(settings)

		expect(onOpenSettings).toHaveBeenCalledOnce()
	})

	it('navigates nowhere when the gear is pressed', async () => {
		const user = userEvent.setup()
		renderComponent({}, ROUTES.play)
		const settings = screen.getByRole('button', { name: SETTINGS_LABEL })

		await user.click(settings)

		const heading = screen.getByRole('heading', { level: 1, name: PLAY_HEADING })
		expect(heading).toBeInTheDocument()
	})

	it('reaches the wordmark and then the gear with Tab', async () => {
		const user = userEvent.setup()
		renderComponent()
		const wordmark = screen.getByRole('link', { name: APP_NAME })
		const settings = screen.getByRole('button', { name: SETTINGS_LABEL })

		await user.tab()
		expect(wordmark).toHaveFocus()

		await user.tab()
		expect(settings).toHaveFocus()
	})

	it('follows the wordmark home with Enter', async () => {
		const user = userEvent.setup()
		renderComponent({}, ROUTES.play)

		await user.tab()
		await user.keyboard('{Enter}')

		const heading = screen.getByRole('heading', { level: 1, name: SETUP_HEADING })
		expect(heading).toBeInTheDocument()
	})

	it.each([
		['Enter', '{Enter}'],
		['Space', '[Space]'],
	])('asks for settings on %s', async (_key, sequence) => {
		const user = userEvent.setup()
		const onOpenSettings = vi.fn()
		renderComponent({ onOpenSettings })
		const settings = screen.getByRole('button', { name: SETTINGS_LABEL })

		settings.focus()
		await user.keyboard(sequence)

		expect(onOpenSettings).toHaveBeenCalledOnce()
	})

	it('takes the wordmark from the catalogue rather than a literal', () => {
		renderComponent({}, ROUTES.setup, { locale: 'nl' })

		const wordmark = screen.getByRole('link', {
			name: createTranslate('nl').translate(globalMessages.appName),
		})

		expect(wordmark).toBeInTheDocument()
	})
})
