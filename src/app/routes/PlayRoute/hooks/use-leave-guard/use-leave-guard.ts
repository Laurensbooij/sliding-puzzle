import { useRef } from 'react'
import { useBlocker } from 'react-router'

export interface LeaveGuard {
	/** Whether a held navigation is waiting on an answer. */
	asking: boolean
	/** The player chose to leave: the held navigation goes through. */
	leave: () => void
	/** The player chose to stay: the held navigation is dropped. */
	keepPlaying: () => void
	/**
	 * Wraps a navigation the player has already agreed to, so the guard lets it
	 * past unasked.
	 */
	unguarded: (navigate: () => void) => () => void
}

/**
 * Holds an in-app navigation while `active`, so the player can be asked before
 * a game in progress is destroyed. Answering is the caller's job — the hook
 * only reports that a navigation is waiting and offers the two answers.
 *
 * `useBlocker` catches in-app navigation only. A browser refresh, a tab close
 * and backing out of the app are deliberately not guarded: `beforeunload`
 * cannot carry our copy and several browsers ignore it without prior
 * interaction. "Refresh starts a new game" is the accepted behaviour, not a bug.
 */
export const useLeaveGuard = (active: boolean): LeaveGuard => {
	// A ref, not state: the blocker is consulted during the very navigation the
	// handler kicked off, which is before any state set beside it has rendered.
	// It is never cleared — the navigation it lets through unmounts the route
	// that owns the guard, so there is nothing left to re-arm.
	const agreedRef = useRef(false)

	const blocker = useBlocker(({ currentLocation, nextLocation }) => {
		if (!active || agreedRef.current) return false
		return currentLocation.pathname !== nextLocation.pathname
	})

	return {
		asking: blocker.state === 'blocked',
		leave: () => blocker.proceed?.(),
		keepPlaying: () => blocker.reset?.(),
		unguarded: (navigate) => () => {
			agreedRef.current = true
			navigate()
		},
	}
}
