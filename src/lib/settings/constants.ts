import { DEFAULT_LOCALE } from '@i18n'

import type { Settings } from './types'

export const SETTINGS_STORAGE_KEY = 'sliding-puzzle.settings.v2'

/**
 * The shape a player starts from. `locale` is the one field the provider does
 * not take at face value — a first visit resolves it from the browser instead
 * (see `SettingsProvider`), so this literal is the floor, not the whole answer.
 */
export const DEFAULT_SETTINGS: Settings = {
	referenceImage: true,
	numberedTiles: false,
	showTimer: true,
	locale: DEFAULT_LOCALE,
}
