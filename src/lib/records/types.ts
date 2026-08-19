import type { GridSize } from '@/lib/game-config'

/** A finished game, reduced to what a record is made of. */
export interface Solve {
	gridSize: GridSize
	moveCount: number
}

/**
 * What the player has achieved: the fewest moves per grid size, and nothing
 * else. Time stays a casual stat, and there is no solve history — the versioned
 * key is the escape hatch if either ever earns a reader.
 */
export interface Records {
	bests: Partial<Record<GridSize, number>>
}
