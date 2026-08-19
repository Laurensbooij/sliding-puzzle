import type { BoardSize } from '@/lib/game-config'
import { isNewBest, useRecords } from '@/lib/records'
import type { Board } from '@engine'
import { useEffect, useRef, useState } from 'react'

export interface RecordedSolveInput {
	/** Whether the game on screen is over and won. Nothing else is recorded. */
	solved: boolean
	/**
	 * The board being played. Its identity is the identity of the solve: every
	 * deal and every move assigns a new one, so it is what tells one win from
	 * the next on a screen where the same actor plays them all.
	 */
	board: Board
	/** The size the game is being played at, which a best belongs to. */
	boardSize: BoardSize
	/** Tiles relocated over the whole game — the number a best is made of. */
	moveCount: number
}

/**
 * Writes the solve on screen into the player's records, once, and reports
 * whether it set a new best.
 *
 * The game machine stays storage-free (SLI-42), so the write lives on this side
 * of the seam: the screen watches the machine reach `solved` and this hook
 * turns that into a `recordSolve`. Nothing sends the machine an event about it.
 *
 * "New best" is read **before** the write, through the records' own
 * `isNewBest`: the records hold the solve by the time it lands, so a comparison
 * afterwards would call every solve a best.
 *
 * Once per solve means once per solve *on screen*. A remount starts a fresh
 * guard, which in the app means a fresh actor and a fresh board anyway — and a
 * solve recorded twice ties with itself, which changes nothing.
 */
export const useRecordedSolve = ({
	solved,
	board,
	boardSize,
	moveCount,
}: RecordedSolveInput): boolean => {
	const { bestFor, recordSolve } = useRecords()
	// A ref rather than state, because it has to be true before this effect can
	// run again on the same board: StrictMode's second invocation gets there
	// before any state update would have landed, and would record twice.
	const recordedBoard = useRef<Board | null>(null)
	const [bestBoard, setBestBoard] = useState<Board | null>(null)

	useEffect(() => {
		if (!solved || recordedBoard.current === board) return

		recordedBoard.current = board
		if (isNewBest(moveCount, bestFor(boardSize))) setBestBoard(board)

		recordSolve({ boardSize, moveCount })
	}, [solved, board, boardSize, moveCount, bestFor, recordSolve])

	// Named by the board it was set on, so the answer expires with the game
	// rather than following the player into the next one.
	return bestBoard === board && solved
}
