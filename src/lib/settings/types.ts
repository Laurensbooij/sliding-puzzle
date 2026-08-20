import type { Locale } from '@i18n'

/**
 * How the player wants the game to look, plus the language it speaks.
 * Independent of what game is being played.
 */
export interface Settings {
	referenceImage: boolean
	numberedTiles: boolean
	showTimer: boolean
	locale: Locale
}
