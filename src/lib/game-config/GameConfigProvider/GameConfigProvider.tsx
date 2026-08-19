import { usePersistedState } from '@/lib/storage'
import type { SourceImageName } from '@/source-images'
import { type FC, type ReactNode, createContext, useCallback, useMemo } from 'react'

import { DEFAULT_GAME_CONFIG, GAME_CONFIG_STORAGE_KEY } from '../constants'
import { isGameConfig } from '../guards'
import type { BoardSize } from '../types'

export interface GameConfigContextValue {
	rows: BoardSize
	cols: BoardSize
	sourceImage: SourceImageName
	setBoardSize: (boardSize: BoardSize) => void
	setSourceImage: (sourceImage: SourceImageName) => void
}

export const GameConfigContext = createContext<GameConfigContextValue | null>(null)

export interface GameConfigProviderProps {
	children: ReactNode
}

/**
 * Holds what game to build, persisted so Setup reopens on the player's last
 * choices. The artwork stops here: Play passes rows and cols to the game
 * machine and the source image to the Board as a prop, so the machine never
 * learns what the tiles look like.
 */
export const GameConfigProvider: FC<GameConfigProviderProps> = ({ children }) => {
	const [gameConfig, setGameConfig] = usePersistedState(
		GAME_CONFIG_STORAGE_KEY,
		isGameConfig,
		DEFAULT_GAME_CONFIG,
	)

	const setBoardSize = useCallback(
		(boardSize: BoardSize) => setGameConfig((previous) => ({ ...previous, boardSize })),
		[setGameConfig],
	)

	const setSourceImage = useCallback(
		(sourceImage: SourceImageName) =>
			setGameConfig((previous) => ({ ...previous, sourceImage })),
		[setGameConfig],
	)

	const contextValue = useMemo(
		() => ({
			rows: gameConfig.boardSize,
			cols: gameConfig.boardSize,
			sourceImage: gameConfig.sourceImage,
			setBoardSize,
			setSourceImage,
		}),
		[gameConfig, setBoardSize, setSourceImage],
	)

	return <GameConfigContext.Provider value={contextValue}>{children}</GameConfigContext.Provider>
}
