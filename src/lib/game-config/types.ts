import type { SourceImageName } from '@source-images'

/**
 * The board sizes Setup offers, and the one place they live: the size control
 * and the record keys both read this list.
 */
export const BOARD_SIZES = [3, 4, 5, 6] as const

/**
 * A board dimension a player may choose. The engine keeps bare numbers — the
 * union narrows only at the config and UI edge.
 */
export type BoardSize = (typeof BOARD_SIZES)[number]

export interface GameConfig {
	boardSize: BoardSize
	sourceImage: SourceImageName
}
