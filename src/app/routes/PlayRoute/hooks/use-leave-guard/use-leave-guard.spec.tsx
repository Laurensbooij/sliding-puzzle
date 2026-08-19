import { renderWithProviders } from '@testing'
import type { RenderResult } from '@testing-library/react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FC } from 'react'
import { Link, RouterProvider, createMemoryRouter, useLocation, useNavigate } from 'react-router'
import { describe, expect, it } from 'vitest'

import { useLeaveGuard } from './use-leave-guard'

const PLAY_PATH = '/play'
const SETUP_PATH = '/'

const HOME_LINK = 'Home'
const BACK_LINK = 'Back to play'
const ABANDON = 'Abandon'
const LEAVE = 'Leave'
const KEEP_PLAYING = 'Keep playing'
const ASKING = 'Asking'
const LOCATION_TESTID = 'location'

interface GuardedRouteProps {
	active: boolean
}

/**
 * Stands in for the Play route: a screen worth guarding, two ways to leave it,
 * and the guard's three answers as plain controls. The copy the player actually
 * reads belongs to the confirmation card and is asserted where that lives.
 */
const GuardedRoute: FC<GuardedRouteProps> = ({ active }) => {
	const { pathname } = useLocation()
	const navigate = useNavigate()
	const guard = useLeaveGuard(active)

	return (
		<>
			<p data-testid={LOCATION_TESTID}>{pathname}</p>
			<Link to={SETUP_PATH}>{HOME_LINK}</Link>
			<Link to={PLAY_PATH}>{BACK_LINK}</Link>
			<button type="button" onClick={guard.unguarded(() => void navigate(SETUP_PATH))}>
				{ABANDON}
			</button>
			{guard.asking && (
				<>
					<p>{ASKING}</p>
					<button type="button" onClick={guard.leave}>
						{LEAVE}
					</button>
					<button type="button" onClick={guard.keepPlaying}>
						{KEEP_PLAYING}
					</button>
				</>
			)}
		</>
	)
}

/**
 * `useBlocker` is a data-router API, so the guard is exercised through a real
 * router with somewhere to go — a `MemoryRouter` would throw before the first
 * assertion. One catch-all route rather than two: the guard has to survive the
 * navigations it lets through, which is what the ref inside it turns on.
 */
const renderComponent = (active: boolean = true): RenderResult =>
	renderWithProviders(
		<RouterProvider
			router={createMemoryRouter([{ path: '*', element: <GuardedRoute active={active} /> }], {
				initialEntries: [PLAY_PATH],
			})}
		/>,
	)

/** Where the router actually is, which is the whole question a blocker answers. */
const location = (): string | null => screen.getByTestId(LOCATION_TESTID).textContent

describe('useLeaveGuard', () => {
	it('holds a navigation while the guard is active', async () => {
		const user = userEvent.setup()
		renderComponent()
		const home = screen.getByRole('link', { name: HOME_LINK })

		await user.click(home)

		const asking = screen.getByText(ASKING)
		expect(asking).toBeInTheDocument()
		expect(location()).toBe(PLAY_PATH)
	})

	it('lets the held navigation through once the player agrees', async () => {
		const user = userEvent.setup()
		renderComponent()
		const home = screen.getByRole('link', { name: HOME_LINK })
		await user.click(home)
		const leave = screen.getByRole('button', { name: LEAVE })

		await user.click(leave)

		expect(location()).toBe(SETUP_PATH)
	})

	it('drops the held navigation when the player keeps playing', async () => {
		const user = userEvent.setup()
		renderComponent()
		const home = screen.getByRole('link', { name: HOME_LINK })
		await user.click(home)
		const keepPlaying = screen.getByRole('button', { name: KEEP_PLAYING })

		await user.click(keepPlaying)

		const asking = screen.queryByText(ASKING)
		expect(location()).toBe(PLAY_PATH)
		expect(asking).not.toBeInTheDocument()
	})

	/** A solved game has nothing left to protect, so the guard stands down. */
	it('asks nothing while the guard is inactive', async () => {
		const user = userEvent.setup()
		renderComponent(false)
		const home = screen.getByRole('link', { name: HOME_LINK })

		await user.click(home)

		expect(location()).toBe(SETUP_PATH)
	})

	/**
	 * The screen's own ✕ asks the same question in its own words. Asking twice
	 * for one answer is the bug `unguarded` exists to prevent.
	 */
	it('lets a navigation the player already agreed to past unasked', async () => {
		const user = userEvent.setup()
		renderComponent()
		const abandon = screen.getByRole('button', { name: ABANDON })

		await user.click(abandon)

		expect(location()).toBe(SETUP_PATH)
	})

	/**
	 * One navigation per agreement. An agreed navigation that leaves the guard
	 * mounted must not disarm it for everything that follows.
	 */
	it('guards again after the navigation it was told to allow', async () => {
		const user = userEvent.setup()
		renderComponent()
		const abandon = screen.getByRole('button', { name: ABANDON })
		await user.click(abandon)
		const back = screen.getByRole('link', { name: BACK_LINK })

		await user.click(back)

		const asking = screen.getByText(ASKING)
		expect(asking).toBeInTheDocument()
		expect(location()).toBe(SETUP_PATH)
	})
})
