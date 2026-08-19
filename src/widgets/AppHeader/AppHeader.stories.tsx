import { ROUTES } from '@/lib/routes'
import { ICON_BUTTON_TESTIDS } from '@components/IconButton'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

import { AppHeader } from './AppHeader'
import styles from './AppHeader.stories.module.css'
import { APP_HEADER_TESTIDS } from './constants'

const TOOLTIP_TESTID = `${APP_HEADER_TESTIDS.BASE}${APP_HEADER_TESTIDS.SETTINGS_SUFFIX}${ICON_BUTTON_TESTIDS.TOOLTIP_SUFFIX}`

/**
 * The header holds a real `<Link>`, so every story needs a router — that is the
 * price of a widget owning its own navigation instead of taking it as a prop. A
 * memory router keeps each story self-contained, and the path it starts on is
 * what decides whether the wordmark is the current page.
 *
 * Declared per story rather than once on the meta: two routers cannot nest, so
 * a meta-level one would leave the story that needs a different path with no way
 * to say so.
 */
const atRoute =
	(path: string): Decorator =>
	(Story) => (
		<RouterProvider
			router={createMemoryRouter([{ path: '*', element: <Story /> }], {
				initialEntries: [path],
			})}
		/>
	)

/**
 * The two frames Figma draws, by width. The `Breakpoint` variant is a media
 * query, so the only way to show both is to hand the story a viewport either
 * side of `--breakpoint-desktop` (48rem / 768px).
 */
const VIEWPORTS = {
	mobile: { name: 'Mobile (Figma 390)', styles: { width: '390px', height: '480px' } },
	desktop: { name: 'Desktop (Figma 1000)', styles: { width: '1000px', height: '480px' } },
}

const meta = {
	title: 'Widgets/AppHeader',
	component: AppHeader,
	args: { onOpenSettings: fn() },
	parameters: {
		layout: 'fullscreen',
		viewport: { options: VIEWPORTS },
	},
	decorators: [
		// The header paints nothing of its own; the page surface under it is what
		// the design judges both its ink colours against.
		(Story) => (
			<div className={styles.page}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof AppHeader>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Figma `Breakpoint=desktop`: 40px gutters, the wordmark at 22px, the row 68
 * tall — the gear plus its padding, never a stated height.
 *
 * On Setup, which is where the wordmark points, so it carries
 * `aria-current="page"` here — and looks no different for it. The design gives
 * the wordmark no active treatment, so that state is for assistive tech only,
 * and the pair with `OnAnotherRoute` is the whole visible difference: none.
 */
export const Desktop: Story = {
	globals: { viewport: { value: 'desktop' } },
	decorators: [atRoute(ROUTES.setup)],
}

/**
 * Figma `Breakpoint=mobile`: 16px gutters, the wordmark at 18px, 60 tall. Same
 * tree and the same two controls — only padding and type size move.
 */
export const Mobile: Story = {
	globals: { viewport: { value: 'mobile' } },
	decorators: [atRoute(ROUTES.setup)],
}

/** Anywhere else — here the Play route — the wordmark is just the way home. */
export const OnAnotherRoute: Story = {
	globals: { viewport: { value: 'desktop' } },
	decorators: [atRoute(ROUTES.play)],
}

/**
 * The wordmark's focus ring, reached by a real Tab rather than a forced
 * pseudo-class, so `:focus-visible` actually matches. It doubles as the evidence
 * that the header's first stop is the wordmark and that the ring sits clear of
 * everything around it (SC 2.4.11).
 */
export const WordmarkFocused: Story = {
	globals: { viewport: { value: 'desktop' } },
	decorators: [atRoute(ROUTES.setup)],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const wordmark = canvas.getByRole('link')
		await userEvent.tab()

		await expect(wordmark).toHaveFocus()
	},
}

/**
 * The second stop, and the reason the gear's chip opens downward: above it there
 * is only the top of the viewport, so a chip placed there gets held on screen
 * over the button and the ring it is meant to sit beside (SC 2.4.11).
 */
export const GearFocused: Story = {
	globals: { viewport: { value: 'desktop' } },
	decorators: [atRoute(ROUTES.setup)],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const settings = canvas.getByRole('button')
		await userEvent.tab()
		await userEvent.tab()

		await expect(settings).toHaveFocus()
		const chip = await canvas.findByTestId(TOOLTIP_TESTID)
		await waitFor(() => expect(chip).toBeVisible())
	},
}
