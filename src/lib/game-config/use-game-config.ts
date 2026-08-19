import { useContext } from 'react'

import {
	GameConfigContext,
	type GameConfigContextValue,
} from './GameConfigProvider/GameConfigProvider'

/** Reads and changes what game to build. Throws outside `<GameConfigProvider>`. */
export const useGameConfig = (): GameConfigContextValue => {
	const context = useContext(GameConfigContext)
	if (!context) throw new Error('useGameConfig must be used inside <GameConfigProvider>')
	return context
}
