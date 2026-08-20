import { createBoard } from '@engine'
import { useGameConfig } from '@game-config'
import { useTranslate } from '@i18n'
import { Board } from '@widgets/Board'
import type { FC } from 'react'
import { useMemo } from 'react'

import { setupPreviewMessages } from './translation-messages'

export interface SetupPreviewProps {
	/** Testid of the board. No default: the screen and its dialog each draw one. */
	dataTestId: string
}

/**
 * The chosen artwork, solved, at the chosen size — decoration, never played.
 *
 * Reads the config rather than taking it as props. The screen draws this board
 * and so does the mobile dialog over it, and neither of the two owns the
 * choices it shows.
 */
export const SetupPreview: FC<SetupPreviewProps> = ({ dataTestId }) => {
	const { rows, cols, sourceImage } = useGameConfig()
	const { translate } = useTranslate()

	// Board compares board identity to decide what changed, so a fresh object on
	// every render would make it recompute the diff for a board that never moves.
	const board = useMemo(() => createBoard(rows, cols), [rows, cols])

	return (
		<Board
			board={board}
			sourceImage={sourceImage}
			interactive={false}
			label={translate(setupPreviewMessages.label, { size: rows })}
			dataTestId={dataTestId}
		/>
	)
}
