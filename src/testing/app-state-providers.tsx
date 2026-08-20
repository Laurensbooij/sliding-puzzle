import { GameConfigProvider } from '@game-config'
import { RecordsProvider } from '@records'
import { SettingsProvider } from '@settings'
import type { ReactNode } from 'react'

export interface RenderProviders {
	gameConfig?: boolean
	settings?: boolean
	records?: boolean
}

/**
 * Mounts the app state providers a spec opted into, nested in `src/app/main.tsx`
 * order regardless of the order the flags were written in. Every flag defaults
 * to off: opting in is how a spec declares its context dependencies.
 */
export const AppStateProviders = ({
	providers: { gameConfig = false, settings = false, records = false },
	children,
}: {
	providers: RenderProviders
	children: ReactNode
}): ReactNode => {
	let tree = children
	if (records) tree = <RecordsProvider>{tree}</RecordsProvider>
	if (settings) tree = <SettingsProvider>{tree}</SettingsProvider>
	if (gameConfig) tree = <GameConfigProvider>{tree}</GameConfigProvider>
	return tree
}
