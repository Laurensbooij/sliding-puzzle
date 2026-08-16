/**
 * Identifies a tile by its home cell index on the solved board.
 * Tile 0 lives at cell 0 when solved, tile 1 at cell 1, and so on.
 */
export type TileId = number

/** Index of a position on the board, row-major from the top-left. */
export type CellIndex = number

/**
 * The canonical board state: a permutation array indexed by cell.
 * `cells[cellIndex]` holds the tile at that cell, or `GAP` for the gap.
 * See ADR-0001 (pure engine) — rendering derives its own projection from this.
 */
export interface Board {
	readonly rows: number
	readonly cols: number
	readonly cells: readonly (TileId | typeof GAP)[]
}

/** The gap marker inside `Board.cells`. */
export const GAP = null

/** One tile relocating into the gap. A multi-tile slide is a sequence of these. */
export interface Move {
	readonly tile: TileId
	readonly from: CellIndex
	readonly to: CellIndex
}

/** A tile's position as the renderer consumes it: stable identity, current cell. */
export interface TilePlacement {
	readonly tile: TileId
	readonly cell: CellIndex
	readonly homeCell: CellIndex
}
