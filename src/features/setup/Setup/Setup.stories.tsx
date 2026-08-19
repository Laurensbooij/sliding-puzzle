import { DEFAULT_GAME_CONFIG, GAME_CONFIG_STORAGE_KEY, GameConfigProvider } from '@/lib/game-config'
import type { BoardSize } from '@/lib/game-config'
import { RECORDS_STORAGE_KEY, RecordsProvider } from '@/lib/records'
import type { Records } from '@/lib/records'
import type { SourceImageName } from '@/source-images'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { Setup } from './Setup'
import { SOURCE_IMAGE_CHOICE_TESTIDS } from './components/SourceImageChoice'

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

/** Figma `1 · Setup` at 1000px: pitch and controls left, the board right. */
export const Desktop: Story = {}

/**
 * Figma `1 · Setup — mobile` at 390px, plus the two controls the design moves
 * into a sheet (SLI-64). One tree at both widths, so the reading order is the
 * same here as above: preview, pitch, controls.
 */
export const Mobile: Story = {
	globals: { viewport: { value: 'setupMobile' } },
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
