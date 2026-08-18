import { renderWithProviders } from '@testing'
import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { StatCard } from './StatCard'
import type { StatCardProps } from './StatCard'
import { STAT_CARD_TESTIDS } from './constants'

const tones: StatCardProps['tone'][] = ['default', 'accent', 'onWood']

describe('StatCard', () => {
	it('pairs its label with its value as a term and its definition', () => {
		renderWithProviders(<StatCard label="Moves" value="042" />)

		const term = screen.getByRole('term')
		const definition = screen.getByRole('definition')
		expect(term).toHaveTextContent('Moves')
		expect(definition).toHaveTextContent('042')
	})

	it('hides its icon from assistive technology so the label remains the term', () => {
		renderWithProviders(<StatCard label="Moves" value="042" icon={<svg />} />)

		const iconSlot = screen.getByTestId(
			`${STAT_CARD_TESTIDS.BASE}${STAT_CARD_TESTIDS.ICON_SUFFIX}`,
		)
		const term = screen.getByRole('term')
		expect(iconSlot).toHaveAttribute('aria-hidden', 'true')
		expect(term).toHaveTextContent('Moves')
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

		const statCard = screen.getByTestId(STAT_CARD_TESTIDS.BASE)
		await user.tab()

		expect(statCard).not.toHaveFocus()
		expect(document.body).toHaveFocus()
	})

	it.each(tones)('renders the %s tone', (tone) => {
		renderWithProviders(<StatCard label="Moves" value="042" tone={tone} />)

		const statCard = screen.getByTestId(STAT_CARD_TESTIDS.BASE)
		expect(statCard).toBeVisible()
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
