import { Button } from '@components/Button'
import { Dialog } from '@components/Dialog'
import { Message } from '@i18n'
import { globalMessages } from '@messages'
import type { FC } from 'react'

import { LEAVE_CONFIRMATION_TESTIDS } from './constants'
import { leaveConfirmationMessages } from './translation-messages'

export interface LeaveConfirmationProps {
	/** Whether a navigation is being held, waiting on this answer. */
	open: boolean
	/** The player chose to leave. The game is abandoned by the route unmounting. */
	onLeave: () => void
	/** The player chose to stay — also what Escape means. */
	onKeepPlaying: () => void
}

/**
 * The question a navigation away from a game in progress raises: leaving
 * abandons the game, so it is asked before the router is let through.
 *
 * A plain `Dialog` composition rather than a shared confirm wrapper, exactly
 * like the ✕ and ↺ questions on the Play screen. The three differ in copy, in
 * consequence and in who acts on the answer; a wrapper would be sugar over that.
 *
 * `Keep playing` leads the action row, so the first Tab off the card reaches the
 * way out rather than the way through, and Escape means it too — the destructive
 * path is never the one a keystroke takes by accident. Focus lands on the card
 * itself, which is `Modal`'s deliberate behaviour: the title and description are
 * read before any control, and a stray Enter cannot throw a game away.
 */
export const LeaveConfirmation: FC<LeaveConfirmationProps> = ({ open, onLeave, onKeepPlaying }) => {
	const base = LEAVE_CONFIRMATION_TESTIDS.BASE

	return (
		<Dialog
			open={open}
			title={<Message message={leaveConfirmationMessages.title} />}
			description={<Message message={leaveConfirmationMessages.description} />}
			onClose={onKeepPlaying}
			dataTestId={base}
			actions={
				<>
					<Button
						variant="ghost"
						onClick={onKeepPlaying}
						dataTestId={`${base}${LEAVE_CONFIRMATION_TESTIDS.KEEP_PLAYING_SUFFIX}`}
					>
						<Message message={globalMessages.keepPlaying} />
					</Button>
					<Button
						variant="danger"
						iconStart="arrow-left"
						onClick={onLeave}
						dataTestId={`${base}${LEAVE_CONFIRMATION_TESTIDS.LEAVE_SUFFIX}`}
					>
						<Message message={leaveConfirmationMessages.leave} />
					</Button>
				</>
			}
		/>
	)
}
