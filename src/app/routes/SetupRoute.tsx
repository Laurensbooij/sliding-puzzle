import { Setup } from '@/features/setup/Setup'
import { ROUTES } from '@/lib/routes'
import type { FC } from 'react'
import { useNavigate } from 'react-router'

/**
 * Setup's route element: the one place that knows starting a game means going
 * to `/play`. The screen itself takes a callback and never learns where it is
 * mounted (ADR-0017).
 */
export const SetupRoute: FC = () => {
	const navigate = useNavigate()

	return <Setup onStart={() => navigate(ROUTES.play)} />
}
