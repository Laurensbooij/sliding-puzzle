import type { Settings } from './types'

export const SETTINGS_STORAGE_KEY = 'sliding-puzzle.settings.v1'

export const DEFAULT_SETTINGS: Settings = {
	referenceImage: true,
	numberedTiles: false,
	showTimer: true,
}
