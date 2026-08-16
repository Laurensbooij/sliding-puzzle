import type { TileId } from '../../engine'

export interface TileProps {
	/** The tile's identity — its home cell index. Rendered as the 1-based label. */
	tile: TileId
	/** Whether pressing this tile currently produces a move. */
	movable?: boolean
	/** Shows the numbered assist label (doubles as the accessible name's anchor). */
	showLabel?: boolean
	/** Called with the tile when pressed. */
	onPress?: (tile: TileId) => void
	/** Overrides the BASE testid for instances rendered in a collection. */
	dataTestId?: string
}
