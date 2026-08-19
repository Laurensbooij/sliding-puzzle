import { isGridSize } from '@/lib/game-config'
import { isJsonObject } from '@/lib/storage'

import type { Records } from './types'

/**
 * JSON turns the numeric keys into strings on the way out, so each one is read
 * back as a number before being checked against the offered sizes.
 */
const isBests = (value: unknown): value is Records['bests'] =>
	isJsonObject(value) &&
	Object.entries(value).every(
		([gridSize, moveCount]) =>
			isGridSize(Number(gridSize)) && typeof moveCount === 'number' && moveCount > 0,
	)

export const isRecords = (value: unknown): value is Records =>
	isJsonObject(value) && isBests(value.bests)
