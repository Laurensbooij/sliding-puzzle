import { ROUTES } from '@/lib/routes'
import { createTranslate } from '@i18n'
import { globalMessages } from '@messages'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { FC } from 'react'
import { Link, RouterProvider, createMemoryRouter } from 'react-router'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

import { useLeaveGuard } from '../../hooks/use-leave-guard/use-leave-guard'
import { LeaveConfirmation } from './LeaveConfirmation'
import { leaveConfirmationMessages } from './translation-messages'

const { translate } = createTranslate()

const TITLE = translate(leaveConfirmationMessages.title)
const KEEP_PLAYING = translate(globalMessages.keepPlaying)

const WORDMARK = translate(globalMessages.appName)

/** The two frames the design draws, by width — same card at both. */
const VIEWPORTS = {
	mobile: { name: 'Mobile (Figma 390)', styles: { width: '390px', height: '844px' } },
	desktop: { name: 'Desktop (Figma 1000)', styles: { width: '1000px', height: '680px' } },
}

/** The game behind the card, so the scrim's blur has something to show. */
const PageBehind: FC = () => (
	<div style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-2)' }}>
		<h1>Eight tiles, one gap.</h1>
		<p>Moves 24 · Time 01:18</p>
	</div>
)

/**
 * The guard as the route wires it: a wordmark that navigates home, held while
 * the game runs. Everything jsdom cannot answer lives here — the top layer,
 * where focus lands, and where it goes back to.
 */
const GuardedGame: FC = () => {
	const guard = useLeaveGuard(true)

	return (
		<>
			<Link to={ROUTES.setup}>{WORDMARK}</Link>
			<LeaveConfirmation
				open={guard.asking}
				onLeave={guard.leave}
				onKeepPlaying={guard.keepPlaying}
			/>
		</>
	)
}

const GuardedRouter: FC = () => (
	<RouterProvider
		router={createMemoryRouter(
			[
				{ path: ROUTES.play, element: <GuardedGame /> },
				{ path: ROUTES.setup, element: <h1>Setup</h1> },
			],
			{ initialEntries: [ROUTES.play] },
		)}
	/>
)

const meta = {
	title: 'App/LeaveConfirmation',
	component: LeaveConfirmation,
	args: { open: true, onLeave: fn(), onKeepPlaying: fn() },
	parameters: {
		layout: 'fullscreen',
		viewport: { options: VIEWPORTS },
	},
	decorators: [
		(Story) => (
			<>
				<PageBehind />
				<Story />
			</>
		),
	],
} satisfies Meta<typeof LeaveConfirmation>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The only state the card has: open, asking. No Figma frame draws it — it is a
 * plain `Dialog` at the `confirm` kind, and this story is where the
 * composition is accepted: the tone badge, the copy, and the danger action
 * beside the way out.
 */
export const Asking: Story = {
	globals: { viewport: { value: 'desktop' } },
}

/** The same card on a phone, capped to the viewport's gutters. */
export const Mobile: Story = {
	globals: { viewport: { value: 'mobile' } },
}

/**
 * The whole guard in Chromium: the wordmark holds its own navigation, the card
 * takes focus, and keeping playing hands focus back to the link that raised it
 * (SC 2.4.11) with the game still on screen.
 */
export const HeldNavigation: Story = {
	args: { open: false },
	globals: { viewport: { value: 'desktop' } },
	render: () => <GuardedRouter />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const wordmark = canvas.getByRole('link', { name: WORDMARK })

		await userEvent.click(wordmark)

		const confirmation = await canvas.findByRole('dialog', { name: TITLE })
		await waitFor(() => expect(confirmation).toBeVisible())

		// Focus starts on the card, so the question is read before any control.
		await expect(confirmation).toHaveFocus()
		await expect(confirmation.matches(':modal')).toBe(true)

		// The first Tab off the card reaches the way out, not the way through.
		await userEvent.tab()
		const keepPlaying = within(confirmation).getByRole('button', { name: KEEP_PLAYING })
		await expect(keepPlaying).toHaveFocus()

		await userEvent.click(keepPlaying)

		await waitFor(() => expect(confirmation).not.toBeVisible())
		await expect(wordmark).toHaveFocus()
	},
}
