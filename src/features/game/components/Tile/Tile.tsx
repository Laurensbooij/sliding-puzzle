import { SOURCE_IMAGES } from '@/source-images'
import type { SourceImageName } from '@/source-images'
import type { TileId } from '@engine'
import { useTranslate } from '@i18n'
import type { FC } from 'react'

import styles from './Tile.module.css'
import { TILE_TESTIDS } from './constants'
import { tileMessages } from './translation-messages'
import type { FragmentStyle } from './types'

export interface TileProps {
	/** The tile's identity — its home cell index. Rendered as the 1-based label. */
	tile: TileId
	/** The source image the whole board reassembles; this tile shows one fragment of it. */
	sourceImage: SourceImageName
	/** Board dimensions — they size the fragment image and place its offset. */
	rows: number
	cols: number
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
 * A tile on the board: a glass surface carrying its fragment of the source
 * image, with an optional numbered assist label. Purely presentational — move
 * legality lives in the engine.
 *
 * A tile that cannot move is `aria-disabled`, not `disabled`: the native
 * attribute drops it from the tab order, and since movability changes after
 * every move that would destroy a keyboard user's focus mid-game.
 *
 * The fragment is the whole source image, scaled to board size and shifted so
 * this tile's home cell lands in view — one cached asset serves every tile and
 * any board dimension works.
 */
export const Tile: FC<TileProps> = ({
	tile,
	sourceImage,
	rows,
	cols,
	movable = false,
	showLabel = true,
	onPress,
	dataTestId,
}) => {
	const { translate } = useTranslate()
	const base = dataTestId ?? TILE_TESTIDS.BASE
	const label = tile + 1
	const fragmentStyle: FragmentStyle = {
		'--fragment-cols': cols,
		'--fragment-rows': rows,
		'--fragment-col': tile % cols,
		'--fragment-row': Math.floor(tile / cols),
	}

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
			<span className={styles.glass} />
			<span className={styles.fragment}>
				<img
					className={styles.fragmentImage}
					data-testid={`${base}${TILE_TESTIDS.IMAGE_SUFFIX}`}
					src={SOURCE_IMAGES[sourceImage]}
					style={fragmentStyle}
					alt=""
					draggable="false"
				/>
			</span>
			<span className={styles.sheen} />
			<span className={styles.bead} />
			<span className={styles.edge} />
			{showLabel && (
				<span className={styles.label} data-testid={`${base}${TILE_TESTIDS.LABEL_SUFFIX}`}>
					{label}
				</span>
			)}
		</button>
	)
}
