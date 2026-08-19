import { usePersistedState } from '@/lib/storage'
import type { SourceImageName } from '@/source-images'
import { type FC, type ReactNode, createContext, useCallback, useMemo } from 'react'

import { DEFAULT_GAME_CONFIG, GAME_CONFIG_STORAGE_KEY } from '../constants'
import { isGameConfig } from '../guards'
import type { GridSize } from '../types'

export interface GameConfigContextValue {
	rows: GridSize
	cols: GridSize
	sourceImage: SourceImageName
	setGridSize: (gridSize: GridSize) => void
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

	const setGridSize = useCallback(
		(gridSize: GridSize) => setGameConfig((previous) => ({ ...previous, gridSize })),
		[setGameConfig],
	)

	const setSourceImage = useCallback(
		(sourceImage: SourceImageName) =>
			setGameConfig((previous) => ({ ...previous, sourceImage })),
		[setGameConfig],
	)

	const contextValue = useMemo(
		() => ({
			rows: gameConfig.gridSize,
			cols: gameConfig.gridSize,
			sourceImage: gameConfig.sourceImage,
			setGridSize,
			setSourceImage,
		}),
		[gameConfig, setGridSize, setSourceImage],
	)

	return <GameConfigContext.Provider value={contextValue}>{children}</GameConfigContext.Provider>
}
