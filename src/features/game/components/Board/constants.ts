import type { Direction } from '@engine'

export const BOARD_TESTIDS = {
	BASE: 'board',
	GAP_SUFFIX: '-gap',
	RESTART_SUFFIX: '-restart',
	TILE_SUFFIX: '-tile',
	ANNOUNCER_SUFFIX: '-announcer',
} as const

/**
 * The keyboard model (ADR-0014): the arrow names where the tile travels, so
 * `ArrowRight` picks the tile to the gap's left.
 */
export const DIRECTION_BY_KEY: Readonly<Record<string, Direction>> = {
	ArrowUp: 'up',
	ArrowDown: 'down',
	ArrowLeft: 'left',
	ArrowRight: 'right',
}
