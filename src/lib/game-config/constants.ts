import type { GameConfig } from './types'

export const GAME_CONFIG_STORAGE_KEY = 'sliding-puzzle.config.v1'

export const DEFAULT_GAME_CONFIG: GameConfig = { gridSize: 3, sourceImage: 'sailboat' }
