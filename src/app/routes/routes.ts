import { ROUTES } from '@/lib/routes'
import type { RouteObject } from 'react-router'

import { AppShell } from '../AppShell'
import { PlayPlaceholder } from '../placeholders/PlayPlaceholder'
import { SetupPlaceholder } from '../placeholders/SetupPlaceholder'
import { RouteFallback } from './RouteFallback'
import { routeMessages } from './translation-messages'
import type { RouteHandle } from './types'

/**
 * The whole route table: plain objects under one layout route, with no loaders
 * and no actions. Everything a screen reads lives in a provider mounted above
 * the router, so there is nothing for the router to fetch.
 *
 * `/play` carries no guard and needs none. The game config is persisted, so a
 * grid size and an artwork always exist, which makes the route valid however it
 * is reached — and mounting it means a fresh shuffled game. Pasting the URL or
 * refreshing mid-game therefore starts over instead of resuming. That is the
 * decision, not an oversight: there is no resume story to bounce anyone back to.
 */
export const routes: RouteObject[] = [
	{
		Component: AppShell,
		children: [
			{
				path: ROUTES.setup,
				Component: SetupPlaceholder,
				handle: { title: routeMessages.setupTitle } satisfies RouteHandle,
			},
			{
				path: ROUTES.play,
				Component: PlayPlaceholder,
				handle: { title: routeMessages.playTitle } satisfies RouteHandle,
			},
			{ path: '*', Component: RouteFallback },
		],
	},
]
