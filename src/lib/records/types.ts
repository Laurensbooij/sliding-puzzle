import type { BoardSize } from '@/lib/game-config'

export interface Solve {
	boardSize: BoardSize
	moveCount: number
}

/**
 * What the player has achieved: the fewest moves per board size, and nothing
 * else. Time stays a casual stat, and there is no solve history — the versioned
 * key is the escape hatch if either ever earns a reader.
 */
export interface Records {
	bests: Partial<Record<BoardSize, number>>
}
