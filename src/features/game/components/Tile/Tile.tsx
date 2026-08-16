import type { TileId } from '@engine'
import { useTranslate } from '@i18n'
import type { FC } from 'react'

import styles from './Tile.module.css'
import { TILE_TESTIDS } from './constants'
import { tileMessages } from './translation-messages'

export interface TileProps {
	/** The tile's identity — its home cell index. Rendered as the 1-based label. */
	tile: TileId
	/** Whether pressing this tile currently produces a move. */
	movable?: boolean
	/** Shows the numbered assist label. Visual only — the accessible name comes from `aria-label`. */
	showLabel?: boolean
	/** Called with the tile when pressed. */
	onPress?: (tile: TileId) => void
	/** Overrides the BASE testid for instances rendered in a collection. */
	dataTestId?: string
}

/**
 * A tile on the board: a glass surface carrying its slice of the source image,
 * with an optional numbered assist label. Purely presentational — move legality
 * lives in the engine.
 *
 * A tile that cannot move is `aria-disabled`, not `disabled`: the native
 * attribute drops it from the tab order, and since movability changes after
 * every move that would destroy a keyboard user's focus mid-game.
 */
export const Tile: FC<TileProps> = ({
	tile,
	movable = false,
	showLabel = true,
	onPress,
	dataTestId,
}) => {
	const { translate } = useTranslate()
	const base = dataTestId ?? TILE_TESTIDS.BASE
	const label = tile + 1

	return (
		<button
			type="button"
			className={styles.tile}
			data-testid={base}
			aria-label={translate(tileMessages.label, { number: label })}
			aria-disabled={!movable}
			onClick={() => {
				if (!movable) return
				onPress?.(tile)
			}}
		>
			{/* Placeholder for this tile's slice of the source image. */}
			<span className={styles.image} data-testid={`${base}${TILE_TESTIDS.IMAGE_SUFFIX}`} />
			{showLabel && (
				<span className={styles.label} data-testid={`${base}${TILE_TESTIDS.LABEL_SUFFIX}`}>
					{label}
				</span>
			)}
		</button>
	)
}
