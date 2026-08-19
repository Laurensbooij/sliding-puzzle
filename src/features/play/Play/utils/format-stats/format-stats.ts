const MS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60

/** The width the designed read-outs are drawn at: `00`, `00:07`. */
const READ_OUT_DIGITS = 2

const pad = (value: number): string => String(value).padStart(READ_OUT_DIGITS, '0')

/**
 * Moves as the card shows them — `00`, `07`, `42`. The padding is a floor, not
 * a cap: the hundredth move reads `142`, and the card is set in tabular
 * figures so the column does not jump when it gets there.
 */
export const formatMoveCount = (moveCount: number): string => pad(moveCount)

/**
 * Elapsed time as `mm:ss`. Minutes grow without bound on purpose — a long game
 * reads `101:23` rather than rolling into an hours field the card has no room
 * to label, and nobody has to work out that `1:41:23` is the same game.
 */
export const formatElapsedTime = (elapsed: number): string => {
	const totalSeconds = Math.floor(elapsed / MS_PER_SECOND)
	const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE)

	return `${pad(minutes)}:${pad(totalSeconds % SECONDS_PER_MINUTE)}`
}
