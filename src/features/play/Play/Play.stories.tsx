import { DEFAULT_GAME_CONFIG, GAME_CONFIG_STORAGE_KEY, GameConfigProvider } from '@/lib/game-config'
import type { BoardSize } from '@/lib/game-config'
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, SettingsProvider } from '@/lib/settings'
import { createTranslate } from '@i18n'
import { gameMachine } from '@machines/game-machine'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { BOARD_TESTIDS } from '@widgets/Board'
import { useActorRef } from '@xstate/react'
import type { FC } from 'react'
import { useEffect } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

import { Play } from './Play'
import { playMessages } from './translation-messages'

const { translate } = createTranslate()

/**
 * A game that comes out solved: the route's own machine with the shuffle taken
 * out of the deal. The engine never returns a solved board from one — ADR-0002
 * — so skipping it is the only way to draw the win.
 */
const solvedMachine = gameMachine.provide({ actions: { shuffleBoard: () => undefined } })

interface PlayGameProps {
	boardSize: BoardSize
	solved: boolean
	onAbandon: () => void
}

/**
 * The half of the Play route a story can carry: it creates the game actor and
 * deals it, exactly as the route does.
 */
const PlayGame: FC<PlayGameProps> = ({ boardSize, solved, onAbandon }) => {
	const game = useActorRef(solved ? solvedMachine : gameMachine, {
		input: { rows: boardSize, cols: boardSize },
	})

	useEffect(() => {
		game.send({ type: 'game.start' })
	}, [game])

	return <Play game={game} onAbandon={onAbandon} />
}

interface PlayStoryProps {
	boardSize: BoardSize
	showTimer: boolean
	solved: boolean
	onAbandon: () => void
}

/**
 * The app around the screen: the two providers it reads, holding what each
 * story wants them to hold.
 *
 * Both hydrate from storage when they mount and expose no way to be seeded
 * directly, so the story writes the same keys a returning player's browser
 * would — before the providers below it are constructed.
 */
const PlayStory: FC<PlayStoryProps> = ({ boardSize, showTimer, solved, onAbandon }) => {
	localStorage.setItem(
		GAME_CONFIG_STORAGE_KEY,
		JSON.stringify({ ...DEFAULT_GAME_CONFIG, boardSize }),
	)
	localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, showTimer }))

	return (
		<GameConfigProvider>
			<SettingsProvider>
				<PlayGame boardSize={boardSize} solved={solved} onAbandon={onAbandon} />
			</SettingsProvider>
		</GameConfigProvider>
	)
}

const meta = {
	title: 'Features/Play',
	component: PlayStory,
	args: { boardSize: 3, showTimer: true, solved: false, onAbandon: fn() },
	parameters: { layout: 'fullscreen' },
	decorators: [
		// Stands in for the shell's `page-content`: the gutters and the outer cap
		// are its job, not the screen's.
		(Story) => (
			<div
				style={{
					maxWidth: 'var(--layout-max)',
					margin: '0 auto',
					padding: 'var(--space-4)',
				}}
			>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof PlayStory>

export default meta
type Story = StoryObj<typeof meta>

/** The designed screen: four read-outs above a freshly dealt 3×3 board. */
export const Playing: Story = {}

/**
 * Show timer off. No Figma frame draws this — the row keeps its two columns on
 * a phone and the odd card takes the whole second row; from the desktop
 * breakpoint up it goes three across in the same footprint.
 */
export const TimerHidden: Story = {
	args: { showTimer: false },
}

/** The other three sizes Setup offers. The read-outs never change shape. */
export const FourByFour: Story = {
	args: { boardSize: 4 },
}

export const FiveByFive: Story = {
	args: { boardSize: 5 },
}

export const SixBySix: Story = {
	args: { boardSize: 6 },
}

/**
 * The question behind the ✕. No Figma frame draws it — it is a plain `Dialog`
 * at the `confirm` kind, and this story is where the composition is accepted:
 * the tone badge, the copy, and the danger action beside the way out.
 *
 * Opened for real in Chromium, which is the half jsdom cannot answer. Focus
 * lands on the card rather than on an action, so the title and the description
 * are read before anything can be pressed and no stray Enter throws a game
 * away.
 */
export const AbandonConfirmation: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const abandon = canvas.getByTestId(`${BOARD_TESTIDS.BASE}${BOARD_TESTIDS.ABANDON_SUFFIX}`)
		await userEvent.click(abandon)

		const confirmation = await canvas.findByRole('dialog', {
			name: translate(playMessages.abandonTitle),
		})
		await waitFor(() => expect(confirmation).toBeVisible())
		await expect(confirmation).toHaveFocus()

		// The first Tab off the card reaches the way out, not the way through.
		await userEvent.tab()
		const keepPlaying = within(confirmation).getByRole('button', {
			name: translate(playMessages.keepPlaying),
		})
		await expect(keepPlaying).toHaveFocus()
	},
}

/** The question behind the ↺, drawn the same way and costing rather less. */
export const RestartConfirmation: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const restart = canvas.getByTestId(`${BOARD_TESTIDS.BASE}${BOARD_TESTIDS.RESTART_SUFFIX}`)
		await userEvent.click(restart)

		const confirmation = await canvas.findByRole('dialog', {
			name: translate(playMessages.restartTitle),
		})
		await waitFor(() => expect(confirmation).toBeVisible())
		await expect(confirmation).toHaveFocus()

		await userEvent.tab()
		const keepPlaying = within(confirmation).getByRole('button', {
			name: translate(playMessages.keepPlaying),
		})
		await expect(keepPlaying).toHaveFocus()
	},
}

/**
 * The win, as the Solved frame draws it: the card over the solved board, whose
 * footer now reads "Solved". The read-outs stand at nought moves and no time —
 * this game was won by never being shuffled, and the card counts what the
 * machine counted. `Features/Play/Solved` is where the played numbers are.
 */
export const SolvedGame: Story = {
	args: { solved: true },
}
