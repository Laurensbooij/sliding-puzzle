import { BOARD_SIZES } from '@/lib/game-config'
import type { BoardSize } from '@/lib/game-config'

const [smallest] = BOARD_SIZES

/**
 * The size the win card offers to play next: one step up the list Setup offers,
 * wrapping 6×6 back to 3×3.
 *
 * Wrapping rather than stopping is what keeps the action row whole — the largest
 * board would otherwise leave a hole where its second button belongs.
 */
export const nextBoardSize = (boardSize: BoardSize): BoardSize =>
	BOARD_SIZES[BOARD_SIZES.indexOf(boardSize) + 1] ?? smallest
