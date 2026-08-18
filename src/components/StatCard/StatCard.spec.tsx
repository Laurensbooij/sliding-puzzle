import { renderWithProviders } from '@testing'
import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { StatCard } from './StatCard'
import type { StatCardProps } from './StatCard'
import { STAT_CARD_TESTIDS } from './constants'

const tones: StatCardProps['tone'][] = ['default', 'accent', 'onWood']

/**
 * WCAG 2.2 AA determinations for StatCard, per docs/conventions/accessibility.md.
 *
 * - Focus (SC 2.4.11) — N/A: static read-out, never focusable.
 * - Target size (SC 2.5.8) — N/A: not a target; nothing here is actionable.
 * - Announcements — N/A, asserted below: the game's own live region announces
 *   moves, so a second live region here would double-speak.
 * - Reduced motion — N/A: declares no transition or animation.
 */
describe('StatCard', () => {
	it('names its value with its label, so the number is never read bare', () => {
		renderWithProviders(<StatCard label="Moves" value="042" />)

		const value = screen.getByRole('definition', { name: 'Moves' })
		expect(value).toHaveTextContent('042')
	})

	it('pairs its label with its value as a term and its definition', () => {
		renderWithProviders(<StatCard label="Moves" value="042" />)

		const term = screen.getByRole('term')
		const definition = screen.getByRole('definition')
		expect(term).toHaveTextContent('Moves')
		expect(definition).toHaveTextContent('042')
	})

	it('hides its icon from assistive technology so the label alone names the value', () => {
		renderWithProviders(<StatCard label="Moves" value="042" icon={<svg />} />)

		const iconSlot = screen.getByTestId(
			`${STAT_CARD_TESTIDS.BASE}${STAT_CARD_TESTIDS.ICON_SUFFIX}`,
		)
		const value = screen.getByRole('definition', { name: 'Moves' })
		expect(iconSlot).toHaveAttribute('aria-hidden', 'true')
		expect(value).toBeVisible()
	})

	it('omits the icon slot entirely when no icon is given', () => {
		renderWithProviders(<StatCard label="Moves" value="042" />)

		const iconSlot = screen.queryByTestId(
			`${STAT_CARD_TESTIDS.BASE}${STAT_CARD_TESTIDS.ICON_SUFFIX}`,
		)
		expect(iconSlot).not.toBeInTheDocument()
	})

	// Announcements: N/A by design. StatCard is a read-out; the game's own live
	// region announces moves, and a second live region here would double-speak.
	it('does not announce its own value changes', () => {
		const { rerender } = renderWithProviders(<StatCard label="Moves" value="042" />)
		rerender(<StatCard label="Moves" value="043" />)

		const statCard = screen.getByTestId(STAT_CARD_TESTIDS.BASE)
		const definition = screen.getByRole('definition')
		expect(statCard).not.toHaveAttribute('aria-live')
		expect(definition).toHaveTextContent('043')
	})

	// Keyboard operation map: empty by design — StatCard is a static read-out.
	it('takes no keyboard focus', async () => {
		const user = userEvent.setup()
		renderWithProviders(<StatCard label="Moves" value="042" />)

		const definition = screen.getByRole('definition')
		await user.tab()

		expect(definition).not.toHaveFocus()
		expect(document.body).toHaveFocus()
	})

	it.each(tones)('renders the %s tone without disturbing the readout', (tone) => {
		renderWithProviders(<StatCard label="Moves" value="042" tone={tone} />)

		const value = screen.getByRole('definition', { name: 'Moves' })
		expect(value).toHaveTextContent('042')
	})

	it('keeps a consumer class name alongside its own', () => {
		renderWithProviders(<StatCard label="Moves" value="042" className="wide" />)

		const statCard = screen.getByTestId(STAT_CARD_TESTIDS.BASE)
		expect(statCard).toHaveClass('wide')
	})

	it('lets a collection override the base testid', () => {
		const overrideTestId = `${STAT_CARD_TESTIDS.BASE}-moves`
		renderWithProviders(<StatCard label="Moves" value="042" dataTestId={overrideTestId} />)

		const statCard = screen.getByTestId(overrideTestId)
		expect(statCard).toBeVisible()
	})
})
