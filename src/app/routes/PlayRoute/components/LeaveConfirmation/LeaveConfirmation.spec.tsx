import { createTranslate } from '@i18n'
import { globalMessages } from '@messages'
import { renderWithProviders } from '@testing'
import type { RenderResult } from '@testing-library/react'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { LeaveConfirmation } from './LeaveConfirmation'
import type { LeaveConfirmationProps } from './LeaveConfirmation'
import { leaveConfirmationMessages } from './translation-messages'

const { translate } = createTranslate()

const TITLE = translate(leaveConfirmationMessages.title)
const LEAVE = translate(leaveConfirmationMessages.leave)
const KEEP_PLAYING = translate(globalMessages.keepPlaying)

const renderComponent = (props: Partial<LeaveConfirmationProps> = {}): RenderResult =>
	renderWithProviders(
		<LeaveConfirmation open onLeave={vi.fn()} onKeepPlaying={vi.fn()} {...props} />,
	)

const card = (): HTMLElement => screen.getByRole('dialog', { name: TITLE })

describe('LeaveConfirmation', () => {
	it('names itself by its question and says what leaving costs', () => {
		renderComponent()

		const confirmation = card()

		expect(confirmation).toBeVisible()
		expect(confirmation).toHaveAccessibleDescription(
			translate(leaveConfirmationMessages.description),
		)
	})

	it('shows nothing while no navigation is being held', () => {
		renderComponent({ open: false })

		const confirmation = screen.queryByRole('dialog', { name: TITLE })

		expect(confirmation).not.toBeInTheDocument()
	})

	/**
	 * Focus lands on the card, so the question is read before anything can be
	 * pressed, and the first Tab off it reaches the way out rather than the way
	 * through — Tab order is DOM order here (SC 2.4.3).
	 */
	it('offers Keep playing before the destructive action', async () => {
		const user = userEvent.setup()
		renderComponent()
		const confirmation = card()
		const keepPlaying = within(confirmation).getByRole('button', { name: KEEP_PLAYING })
		const leave = within(confirmation).getByRole('button', { name: LEAVE })

		await user.tab()
		expect(keepPlaying).toHaveFocus()

		await user.tab()
		expect(leave).toHaveFocus()
	})

	it('reports the answer when the player leaves', async () => {
		const user = userEvent.setup()
		const onLeave = vi.fn()
		renderComponent({ onLeave })
		const leave = within(card()).getByRole('button', { name: LEAVE })

		await user.click(leave)

		expect(onLeave).toHaveBeenCalledOnce()
	})

	it('reports the answer when the player keeps playing', async () => {
		const user = userEvent.setup()
		const onKeepPlaying = vi.fn()
		renderComponent({ onKeepPlaying })
		const keepPlaying = within(card()).getByRole('button', { name: KEEP_PLAYING })

		await user.click(keepPlaying)

		expect(onKeepPlaying).toHaveBeenCalledOnce()
	})

	// Escape is the other way out of the card, and it must never be the
	// destructive path — closing this question means keeping the game.
	it('keeps playing on Escape', async () => {
		const user = userEvent.setup()
		const onLeave = vi.fn()
		const onKeepPlaying = vi.fn()
		renderComponent({ onLeave, onKeepPlaying })

		await user.keyboard('{Escape}')

		expect(onKeepPlaying).toHaveBeenCalledOnce()
		expect(onLeave).not.toHaveBeenCalled()
	})
})
