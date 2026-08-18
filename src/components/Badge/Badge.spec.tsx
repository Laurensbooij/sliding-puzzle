import { renderWithProviders } from '@testing'
import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Badge } from './Badge'
import type { BadgeProps } from './Badge'
import { BADGE_TESTIDS } from './constants'

const tones: BadgeProps['tone'][] = ['neutral', 'accent', 'amber', 'danger', 'inverse']

describe('Badge', () => {
	it('exposes its content as text, in the casing it was given', () => {
		renderWithProviders(<Badge>Solved</Badge>)

		const badge = screen.getByText('Solved')
		expect(badge).toBeVisible()
	})

	it('carries no role of its own until a consumer gives it one', () => {
		renderWithProviders(<Badge>Solved</Badge>)

		const badge = screen.getByTestId(BADGE_TESTIDS.BASE)
		expect(badge).not.toHaveAttribute('role')
	})

	it('can be promoted to a named status region by its consumer', () => {
		renderWithProviders(
			<Badge role="status" aria-label="Board state">
				Solved
			</Badge>,
		)

		const status = screen.getByRole('status', { name: 'Board state' })
		expect(status).toBeVisible()
	})

	it('hides its icon from assistive technology so the text remains the name', () => {
		renderWithProviders(<Badge icon={<svg />}>Solved</Badge>)

		const iconSlot = screen.getByTestId(`${BADGE_TESTIDS.BASE}${BADGE_TESTIDS.ICON_SUFFIX}`)
		expect(iconSlot).toHaveAttribute('aria-hidden', 'true')
	})

	it('omits the icon slot entirely when no icon is given', () => {
		renderWithProviders(<Badge>Solved</Badge>)

		const iconSlot = screen.queryByTestId(`${BADGE_TESTIDS.BASE}${BADGE_TESTIDS.ICON_SUFFIX}`)
		expect(iconSlot).not.toBeInTheDocument()
	})

	// Keyboard operation map: empty by design — Badge is static, per Figma
	// ("Small status / meta pill. Static — no interaction states.").
	it('takes no keyboard focus', async () => {
		const user = userEvent.setup()
		renderWithProviders(<Badge>Solved</Badge>)

		const badge = screen.getByTestId(BADGE_TESTIDS.BASE)
		await user.tab()

		expect(badge).not.toHaveFocus()
		expect(document.body).toHaveFocus()
	})

	it.each(tones)('renders the %s tone', (tone) => {
		renderWithProviders(<Badge tone={tone}>Solved</Badge>)

		const badge = screen.getByTestId(BADGE_TESTIDS.BASE)
		expect(badge).toBeVisible()
	})

	it('keeps a consumer class name alongside its own', () => {
		renderWithProviders(<Badge className="pinned">Solved</Badge>)

		const badge = screen.getByTestId(BADGE_TESTIDS.BASE)
		expect(badge).toHaveClass('pinned')
	})

	it('lets a collection override the base testid', () => {
		const overrideTestId = `${BADGE_TESTIDS.BASE}-streak`
		renderWithProviders(<Badge dataTestId={overrideTestId}>Solved</Badge>)

		const badge = screen.getByTestId(overrideTestId)
		expect(badge).toBeVisible()
	})
})
