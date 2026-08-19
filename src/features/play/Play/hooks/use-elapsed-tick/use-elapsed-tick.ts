import { useEffect, useState } from 'react'

/** One tick a second — the resolution the designed `mm:ss` read-out shows. */
const TICK_INTERVAL_MS = 1000

/**
 * Re-renders its caller once a second while `active`, and never otherwise.
 *
 * The game machine keeps two instants and derives the duration between them
 * (ADR-0003), so it schedules nothing and emits nothing between moves. A live
 * read-out therefore needs someone to ask again — this is that someone. It
 * owns no time of its own: what ends up on screen is still the machine's
 * number, re-derived on a render this forces.
 *
 * Nothing outside Play needs a live clock, so it stays here rather than
 * climbing to a shared tier.
 */
export const useElapsedTick = (active: boolean): void => {
	const [, setTick] = useState(0)

	useEffect(() => {
		if (!active) return

		const intervalId = window.setInterval(() => setTick((tick) => tick + 1), TICK_INTERVAL_MS)

		return () => window.clearInterval(intervalId)
	}, [active])
}
