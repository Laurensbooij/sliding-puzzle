import { ROUTES } from '@/lib/routes'
import type { FC } from 'react'
import { Navigate } from 'react-router'

/**
 * Unknown paths land on Setup — the app has two screens and no designed 404
 * surface. `replace` keeps the bad URL out of history, so Back returns where
 * the player came from instead of bouncing off it again.
 */
export const RouteFallback: FC = () => <Navigate to={ROUTES.setup} replace />
