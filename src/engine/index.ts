export {
	applyMove,
	cellForDirection,
	createBoard,
	directionOfMove,
	isSolved,
	movableTiles,
	movesForCell,
	toPlacements,
} from './board/board'
export { shuffle } from './shuffle/shuffle'
export { GAP } from './types'
export type { Board, CellIndex, Direction, Move, TileId, TilePlacement } from './types'
