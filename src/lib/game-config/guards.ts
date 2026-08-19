import { isJsonObject } from '@/lib/storage'
import { SOURCE_IMAGE_NAMES } from '@/source-images'

import { GRID_SIZES, type GameConfig, type GridSize } from './types'

/** A size is only a `GridSize` if Setup still offers it — a dropped size reads as invalid. */
export const isGridSize = (value: unknown): value is GridSize =>
	GRID_SIZES.some((gridSize): boolean => gridSize === value)

/** The image key is checked against the source-image registry, so a removed artwork resets. */
export const isGameConfig = (value: unknown): value is GameConfig =>
	isJsonObject(value) &&
	isGridSize(value.gridSize) &&
	SOURCE_IMAGE_NAMES.some((name): boolean => name === value.sourceImage)
