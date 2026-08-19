import type { BoardSize } from '@/lib/game-config'
import { createBoard } from '@engine'
import { Message } from '@i18n'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Board } from '@widgets/Board'
import type { FC } from 'react'

import { playMessages } from '../../translation-messages'
import { Solved } from './Solved'

const SECOND_MS = 1000

/** Every action starts a game, and a story has none to start. */
const noop = () => undefined

interface SolvedStoryProps {
	boardSize: BoardSize
	moveCount: number
	elapsed: number
	isNewBest: boolean
}

/**
 * The card over what it is drawn over: the solved board, its footer already
 * reading "Solved". The board behind is decoration here — the screen that plays
 * one lives a tier up, and every story below varies only the game just won.
 */
const SolvedStory: FC<SolvedStoryProps> = ({ boardSize, moveCount, elapsed, isNewBest }) => (
	<>
		<Board
			board={createBoard(boardSize, boardSize)}
			sourceImage="sailboat"
			interactive={false}
			label="The solved board"
			footer
			hint={<Message message={playMessages.solvedHint} />}
		/>
		<Solved
			open
			moveCount={moveCount}
			elapsed={elapsed}
			boardSize={boardSize}
			isNewBest={isNewBest}
			onPlayAgain={noop}
			onTryNextSize={noop}
			onClose={noop}
		/>
	</>
)

const meta = {
	title: 'Features/Play/Solved',
	component: SolvedStory,
	args: { boardSize: 3, moveCount: 42, elapsed: 78 * SECOND_MS, isNewBest: true },
	parameters: { layout: 'centered' },
} satisfies Meta<typeof SolvedStory>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The designed card: the 3×3 win, offering the 4×4 above it. The description
 * reads the way the Solved frame draws it — the record line over the permanent
 * time line.
 */
export const ThreeByThree: Story = {}

/**
 * The same win, having beaten nothing: a tie or a worse game keeps the time
 * line and drops the celebration. It adds, it never replaces (SLI-44).
 */
export const NoRecord: Story = {
	args: { isNewBest: false },
}

export const FourByFour: Story = {
	args: { boardSize: 4, moveCount: 96, elapsed: 214 * SECOND_MS },
}

export const FiveByFive: Story = {
	args: { boardSize: 5, moveCount: 188, elapsed: 470 * SECOND_MS },
}

/**
 * The wrap. The largest board has no size above it, so the second action offers
 * the smallest one instead of disappearing and leaving the row a hole.
 */
export const SixBySix: Story = {
	args: { boardSize: 6, moveCount: 321, elapsed: 903 * SECOND_MS },
}

/** A one-move win — the title is pluralised, so this reads "1 move". */
export const OneMove: Story = {
	args: { moveCount: 1, elapsed: 4 * SECOND_MS },
}
