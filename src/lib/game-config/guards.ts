import { isJsonObject } from '@/lib/storage'
import { SOURCE_IMAGE_NAMES } from '@/source-images'

import { BOARD_SIZES, type BoardSize, type GameConfig } from './types'

/** A size is only a `BoardSize` if Setup still offers it — a dropped size reads as invalid. */
export const isBoardSize = (value: unknown): value is BoardSize =>
	BOARD_SIZES.some((boardSize): boolean => boardSize === value)

/** The image key is checked against the source-image registry, so a removed artwork resets. */
export const isGameConfig = (value: unknown): value is GameConfig =>
	isJsonObject(value) &&
	isBoardSize(value.boardSize) &&
	SOURCE_IMAGE_NAMES.some((name): boolean => name === value.sourceImage)
