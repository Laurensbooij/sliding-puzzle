import { Button } from '@components/Button'
import { createTranslate } from '@i18n'
import { globalMessages } from '@messages'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { FC } from 'react'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

import { LeaveConfirmation } from './LeaveConfirmation'
import { leaveConfirmationMessages } from './translation-messages'

const { translate } = createTranslate()

const TITLE = translate(leaveConfirmationMessages.title)
const LEAVE = translate(leaveConfirmationMessages.leave)
const KEEP_PLAYING = translate(globalMessages.keepPlaying)
const WORDMARK = translate(globalMessages.appName)

/** The two frames the design draws, by width — same card at both. */
const VIEWPORTS = {
	mobile: { name: 'Mobile (Figma 390)', styles: { width: '390px', height: '844px' } },
	desktop: { name: 'Desktop (Figma 1000)', styles: { width: '1000px', height: '680px' } },
}

/** Bound once: a spy rebuilt on every render would lose what it recorded. */
const leave = fn()

/** The game behind the card, so the scrim's blur has something to show. */
const PageBehind: FC = () => (
	<div style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-2)' }}>
		<h1>Eight tiles, one gap.</h1>
		<p>Moves 24 · Time 01:18</p>
	</div>
)

/**
 * Raised from a control, the way the header's wordmark raises it — but by
 * local state rather than by a real blocked navigation.
 *
 * Deliberate: `useBlocker` registers in an effect a commit after mount, so a
 * story that clicks a `Link` in the same tick as it renders races that
 * registration and sails straight through. A player never can. The guard's own
 * behaviour is asserted against a real router in `use-leave-guard.spec.tsx`
 * and `routes.spec.tsx`; what only a browser can answer is what this card does
 * once it is up, and that needs no router at all.
 */
const TriggeredLeaveConfirmation: FC = () => {
	const [asking, setAsking] = useState(false)

	return (
		<>
			<Button variant="ghost" onClick={() => setAsking(true)}>
				{WORDMARK}
			</Button>
			<LeaveConfirmation
				open={asking}
				onLeave={leave}
				onKeepPlaying={() => setAsking(false)}
			/>
		</>
	)
}

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
 * What jsdom cannot answer: the top layer, focus landing on the card, and
 * focus handed back to the control that raised it (SC 2.4.11).
 *
 * Dismissed through Keep playing rather than Escape — Escape needs the
 * browser's own close watcher, which the automation harness never drives. That
 * path is covered by the jsdom spec's shim and by the manual pass.
 */
export const RaisedFromAControl: Story = {
	args: { open: false },
	globals: { viewport: { value: 'desktop' } },
	render: () => <TriggeredLeaveConfirmation />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		const trigger = canvas.getByRole('button', { name: WORDMARK })

		await userEvent.click(trigger)

		const confirmation = await canvas.findByRole('dialog', { name: TITLE })
		await waitFor(() => expect(confirmation).toBeVisible())

		// Focus starts on the card, so the question is read before any control.
		await expect(confirmation).toHaveFocus()
		await expect(confirmation.matches(':modal')).toBe(true)

		// The first Tab off the card reaches the way out, not the way through.
		await userEvent.tab()
		const keepPlaying = within(confirmation).getByRole('button', { name: KEEP_PLAYING })
		await expect(keepPlaying).toHaveFocus()

		await userEvent.tab()
		const leave = within(confirmation).getByRole('button', { name: LEAVE })
		await expect(leave).toHaveFocus()

		await userEvent.click(keepPlaying)

		await waitFor(() => expect(confirmation).not.toBeVisible())
		await expect(trigger).toHaveFocus()
	},
}
