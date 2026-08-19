import { renderWithProviders } from '@testing'
import type { RenderResult } from '@testing-library/react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FC } from 'react'
import { Link, RouterProvider, createMemoryRouter, useNavigate } from 'react-router'
import { describe, expect, it } from 'vitest'

import { useLeaveGuard } from './use-leave-guard'

const PLAY_PATH = '/play'
const SETUP_PATH = '/'

const PLAY_HEADING = 'Play'
const SETUP_HEADING = 'Setup'
const HOME_LINK = 'Home'
const ABANDON = 'Abandon'
const LEAVE = 'Leave'
const KEEP_PLAYING = 'Keep playing'
const ASKING = 'Asking'

interface GuardedRouteProps {
	active: boolean
}

/**
 * Stands in for the Play route: a screen worth guarding, a link that leaves it,
 * and the guard's three answers as plain controls. The copy the player actually
 * reads belongs to the confirmation card and is asserted where that lives.
 */
const GuardedRoute: FC<GuardedRouteProps> = ({ active }) => {
	const navigate = useNavigate()
	const guard = useLeaveGuard(active)

	return (
		<>
			<h1>{PLAY_HEADING}</h1>
			<Link to={SETUP_PATH}>{HOME_LINK}</Link>
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
 * assertion.
 */
const renderComponent = (active: boolean = true): RenderResult =>
	renderWithProviders(
		<RouterProvider
			router={createMemoryRouter(
				[
					{ path: PLAY_PATH, element: <GuardedRoute active={active} /> },
					{ path: SETUP_PATH, element: <h1>{SETUP_HEADING}</h1> },
				],
				{ initialEntries: [PLAY_PATH] },
			)}
		/>,
	)

const heading = (name: string): HTMLElement | null =>
	screen.queryByRole('heading', { level: 1, name })

describe('useLeaveGuard', () => {
	it('holds a navigation while the guard is active', async () => {
		const user = userEvent.setup()
		renderComponent()
		const home = screen.getByRole('link', { name: HOME_LINK })

		await user.click(home)

		const asking = screen.getByText(ASKING)
		expect(asking).toBeInTheDocument()
		expect(heading(PLAY_HEADING)).toBeInTheDocument()
		expect(heading(SETUP_HEADING)).not.toBeInTheDocument()
	})

	it('lets the held navigation through once the player agrees', async () => {
		const user = userEvent.setup()
		renderComponent()
		const home = screen.getByRole('link', { name: HOME_LINK })
		await user.click(home)
		const leave = screen.getByRole('button', { name: LEAVE })

		await user.click(leave)

		expect(heading(SETUP_HEADING)).toBeInTheDocument()
	})

	it('drops the held navigation when the player keeps playing', async () => {
		const user = userEvent.setup()
		renderComponent()
		const home = screen.getByRole('link', { name: HOME_LINK })
		await user.click(home)
		const keepPlaying = screen.getByRole('button', { name: KEEP_PLAYING })

		await user.click(keepPlaying)

		const asking = screen.queryByText(ASKING)
		expect(heading(PLAY_HEADING)).toBeInTheDocument()
		expect(asking).not.toBeInTheDocument()
	})

	/** A solved game has nothing left to protect, so the guard stands down. */
	it('asks nothing while the guard is inactive', async () => {
		const user = userEvent.setup()
		renderComponent(false)
		const home = screen.getByRole('link', { name: HOME_LINK })

		await user.click(home)

		expect(heading(SETUP_HEADING)).toBeInTheDocument()
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

		expect(heading(SETUP_HEADING)).toBeInTheDocument()
	})
})
