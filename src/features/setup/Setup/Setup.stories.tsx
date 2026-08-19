import { DEFAULT_GAME_CONFIG, GAME_CONFIG_STORAGE_KEY, GameConfigProvider } from '@/lib/game-config'
import type { BoardSize } from '@/lib/game-config'
import { RECORDS_STORAGE_KEY, RecordsProvider } from '@/lib/records'
import type { Records } from '@/lib/records'
import type { SourceImageName } from '@/source-images'
import { createTranslate } from '@i18n'
import { globalMessages } from '@messages'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

import { Setup } from './Setup'
import { setupDialogMessages } from './components/SetupDialog/translation-messages'
import { SOURCE_IMAGE_CHOICE_TESTIDS } from './components/SourceImageChoice'
import { setupMessages } from './translation-messages'

const { translate } = createTranslate()

const START_LABEL = translate(setupMessages.start)
const DIALOG_TITLE = translate(setupDialogMessages.title)
const CLOSE_LABEL = translate(globalMessages.close)

/** The two frames Figma draws Setup at, so a story can be read against one. */
const VIEWPORTS = {
	setupMobile: { name: 'Setup — mobile', styles: { width: '390px', height: '844px' } },
	setupDesktop: { name: 'Setup — desktop', styles: { width: '1000px', height: '680px' } },
} as const

/**
 * Both providers, seeded before they mount. Setup reads its state back from
 * them rather than holding any, so a story is set up by writing the storage
 * they read — the same way a returning player's session is.
 */
const seed = (boardSize: BoardSize, sourceImage: SourceImageName, bests: Records['bests']) => {
	localStorage.setItem(GAME_CONFIG_STORAGE_KEY, JSON.stringify({ boardSize, sourceImage }))
	localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify({ bests } satisfies Records))
}

/** Opens the mobile dialog the way a player does, and hands back its card. */
const openDialog = async (canvasElement: HTMLElement): Promise<HTMLElement> => {
	const canvas = within(canvasElement)
	const trigger = canvas.getByRole('button', { name: START_LABEL })
	await userEvent.click(trigger)

	const card = await canvas.findByRole('dialog', { name: DIALOG_TITLE })
	await waitFor(() => expect(card).toBeVisible())

	return card
}

interface SetupStoryArgs {
	onStart: () => void
	boardSize: BoardSize
	sourceImage: SourceImageName
	bests: Records['bests']
}

const meta = {
	title: 'Features/Setup',
	component: Setup,
	args: {
		onStart: fn(),
		boardSize: DEFAULT_GAME_CONFIG.boardSize,
		sourceImage: DEFAULT_GAME_CONFIG.sourceImage,
		bests: {},
	},
	parameters: {
		layout: 'fullscreen',
		viewport: { options: VIEWPORTS },
	},
	globals: { viewport: { value: 'setupDesktop' } },
	render: ({ onStart, boardSize, sourceImage, bests }) => {
		// Written during render rather than in a decorator: the providers read the
		// key once, on their own first render, and a decorator's effect would run
		// after that.
		seed(boardSize, sourceImage, bests)

		return (
			// `key` remounts the providers whenever a control changes, so the
			// Controls panel stays the source of truth for what is stored.
			<GameConfigProvider key={`${boardSize}-${sourceImage}-${JSON.stringify(bests)}`}>
				<RecordsProvider>
					<Setup onStart={onStart} />
				</RecordsProvider>
			</GameConfigProvider>
		)
	},
} satisfies Meta<SetupStoryArgs>

export default meta
type Story = StoryObj<typeof meta>

/** Figma `1 · Setup` at 1000: pitch and controls left, the board right. */
export const Desktop: Story = {}

/**
 * Figma `1 · Setup — mobile` at 390: preview, pitch, and the one button that
 * opens the choices. The controls are not on this page at this width — they are
 * in the dialog below (ADR-0016).
 */
export const Mobile: Story = {
	globals: { viewport: { value: 'setupMobile' } },
}

/**
 * Figma `1b · Setup sheet — mobile`, opened the way a player opens it.
 *
 * Also what jsdom can't answer: the top layer, the inert page behind, and focus
 * landing on the card so its name is read before any control.
 */
export const MobileDialog: Story = {
	globals: { viewport: { value: 'setupMobile' } },
	play: async ({ canvasElement }) => {
		const card = await openDialog(canvasElement)

		await expect(card).toHaveFocus()
		await expect(card.matches(':modal')).toBe(true)
	},
}

/** The dialog on the size with a record — the one line that changes with it. */
export const MobileDialogWithRecord: Story = {
	args: { boardSize: 4, bests: { 4: 128 } },
	globals: { viewport: { value: 'setupMobile' } },
	play: async ({ canvasElement }) => {
		await openDialog(canvasElement)
	},
}

/**
 * The ✕'s ring, reached by a real Tab from the card — checks it clears the
 * card's own edge (SC 2.4.11). Also the dialog's first stop.
 */
export const MobileDialogCloseFocused: Story = {
	globals: { viewport: { value: 'setupMobile' } },
	play: async ({ canvasElement }) => {
		const card = await openDialog(canvasElement)
		const close = within(card).getByRole('button', { name: CLOSE_LABEL })

		await userEvent.tab()

		await expect(close).toHaveFocus()
	},
}

/** The designed empty state: nothing solved at this size yet. */
export const WithoutRecord: Story = {
	args: { boardSize: 4, bests: {} },
}

/** The filled variant, decided without a Figma frame — the drawn one only ever
 * lived on the Records screen, which was cut. */
export const WithRecord: Story = {
	args: { boardSize: 4, bests: { 4: 128 } },
}

/** The affordance on an unchosen swatch — the chosen one is designed not to react. */
export const SourceImageHovered: Story = {
	parameters: {
		pseudo: {
			hover: [
				`[data-testid="${SOURCE_IMAGE_CHOICE_TESTIDS.BASE}${SOURCE_IMAGE_CHOICE_TESTIDS.SWATCH_SUFFIX}-rocket"]`,
			],
		},
	},
}

/** Focus rings sit outside their control at a positive offset, so nothing clips
 * them (SC 2.4.11). */
export const SourceImageFocused: Story = {
	parameters: {
		pseudo: {
			focusVisible: [
				`[data-testid="${SOURCE_IMAGE_CHOICE_TESTIDS.BASE}${SOURCE_IMAGE_CHOICE_TESTIDS.SWATCH_SUFFIX}-sailboat"]`,
			],
		},
	},
}
