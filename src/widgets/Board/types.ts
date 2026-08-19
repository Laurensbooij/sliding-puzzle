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

/**
 * What the live region says, and which move said it. The counter is what makes
 * two identical sentences two announcements rather than one.
 */
export interface Announcement {
	text: string
	move: number
}
