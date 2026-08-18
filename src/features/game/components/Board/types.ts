import type { CSSProperties } from 'react'

/** The cell a positioned element sits on, as its stylesheet consumes it. */
export interface CellStyle extends CSSProperties {
	'--cell-row': number
	'--cell-col': number
}

/** Board dimensions, read by the well to size and place every cell. */
export interface WellStyle extends CSSProperties {
	'--board-rows': number
	'--board-cols': number
}
