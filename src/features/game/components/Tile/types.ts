import type { CSSProperties } from 'react'

/** The home-cell geometry the inline fragment `<svg>` is sized and offset by. */
export interface FragmentStyle extends CSSProperties {
	'--fragment-cols': number
	'--fragment-rows': number
	'--fragment-col': number
	'--fragment-row': number
}
