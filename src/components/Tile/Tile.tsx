import type { FC } from 'react'

import styles from './Tile.module.css'
import { TILE_TESTIDS } from './constants'
import type { TileProps } from './types'

/**
 * One movable piece of the board: a glass surface carrying its fragment of the
 * source image, with an optional numbered assist label that anchors the
 * accessible name. Purely presentational — legality lives in the engine.
 */
export const Tile: FC<TileProps> = ({
	tile,
	movable = false,
	showLabel = true,
	onPress,
	dataTestId,
}) => {
	const base = dataTestId ?? TILE_TESTIDS.BASE
	const label = tile + 1

	return (
		<button
			type="button"
			className={styles.tile}
			data-testid={base}
			aria-label={`Tile ${label}`}
			disabled={!movable}
			onClick={() => onPress?.(tile)}
		>
			{/* Placeholder for the sliced source-image fragment. */}
			<span className={styles.image} data-testid={`${base}${TILE_TESTIDS.IMAGE_SUFFIX}`} />
			{showLabel && (
				<span className={styles.label} data-testid={`${base}${TILE_TESTIDS.LABEL_SUFFIX}`}>
					{label}
				</span>
			)}
		</button>
	)
}
