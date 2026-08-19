export { GameConfigProvider } from './GameConfigProvider/GameConfigProvider'
export type {
	GameConfigContextValue,
	GameConfigProviderProps,
} from './GameConfigProvider/GameConfigProvider'
export { useGameConfig } from './use-game-config'
export { isGameConfig, isBoardSize } from './guards'
export { DEFAULT_GAME_CONFIG, GAME_CONFIG_STORAGE_KEY } from './constants'
export { BOARD_SIZES } from './types'
export type { GameConfig, BoardSize } from './types'
