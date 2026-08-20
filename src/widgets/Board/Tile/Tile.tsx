import type { TileId } from '@engine'
import { useTranslate } from '@i18n'
import { SOURCE_IMAGES } from '@source-images'
import type { SourceImageName } from '@source-images'
import type { FC, KeyboardEvent } from 'react'
import { useState } from 'react'

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
 * A tile that cannot move is skipped by Tab, but it is `aria-disabled` with
 * `tabIndex={-1}` rather than natively `disabled`. Both drop it as a tab stop;
 * only the native attribute also blurs it. Movability flips after every move,
 * so the tile under a keyboard user's focus can turn unmovable beneath them —
 * `disabled` would strand that focus on the body mid-game, while `tabIndex`
 * leaves it focused until they choose to move on. It stays in the
 * accessibility tree either way, so screen-reader users still find it.
 *
 * Holding Space shows the pressed state for as long as it is held, mirroring
 * what a pointer does. The browser's own `:active` covers the pointer; it is
 * not dependable for keyboard activation, so that half is tracked here and
 * styled through `data-pressed`.
 *
 * The fragment is the whole source image, scaled to board size and shifted so
 * this tile's home cell lands in view — no build-time slicing, and any board
 * dimension works. The image is inlined so its `currentColor` strokes take the
 * ink colour set here.
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
	const [pressedByKey, setPressedByKey] = useState(false)
	const { translate } = useTranslate()
	const SourceImage = SOURCE_IMAGES[sourceImage]
	const base = dataTestId ?? TILE_TESTIDS.BASE
	const label = tile + 1
	const handleClick = () => {
		if (!movable) return
		onPress?.(tile)
	}

	// Space activates a button on key *up*, so the press reads as held.
	const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
		if (event.key === ' ' && movable) setPressedByKey(true)
	}

	const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
		if (event.key === ' ') setPressedByKey(false)
	}

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
			tabIndex={movable ? 0 : -1}
			data-pressed={pressedByKey || undefined}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			onKeyUp={handleKeyUp}
			// Focus can leave mid-hold; the key-up would never arrive.
			onBlur={() => setPressedByKey(false)}
		>
			<span className={styles.glass} />
			<span className={styles.fragment}>
				<SourceImage
					className={styles.fragmentImage}
					data-testid={`${base}${TILE_TESTIDS.IMAGE_SUFFIX}`}
					style={fragmentStyle}
					// Stretched to the board box like the board image it is, not
					// letterboxed into it.
					preserveAspectRatio="none"
					aria-hidden
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
