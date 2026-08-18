import { renderWithProviders } from '@testing'
import { screen } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { StatCard } from './StatCard'
import type { StatCardProps } from './StatCard'
import { STAT_CARD_TESTIDS } from './constants'

const LABEL = 'Moves'
const VALUE = '042'

const tones: StatCardProps['tone'][] = ['neutral', 'accent', 'onWood']

/**
 * The one render for every case. `label` and `value` are the component's only
 * required props, so they carry defaults and a case names just the one it varies.
 */
const renderComponent = ({
	label = LABEL,
	value = VALUE,
	...props
}: Partial<StatCardProps> = {}): RenderResult =>
	renderWithProviders(<StatCard label={label} value={value} {...props} />)

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
		renderComponent()

		const value = screen.getByRole('definition', { name: LABEL })
		expect(value).toHaveTextContent(VALUE)
	})

	it('pairs its label with its value as a term and its definition', () => {
		renderComponent()

		const term = screen.getByRole('term')
		const definition = screen.getByRole('definition')
		expect(term).toHaveTextContent(LABEL)
		expect(definition).toHaveTextContent(VALUE)
	})

	it('hides its icon from assistive technology so the label alone names the value', () => {
		renderComponent({ icon: <svg /> })

		const iconSlot = screen.getByTestId(
			`${STAT_CARD_TESTIDS.BASE}${STAT_CARD_TESTIDS.ICON_SUFFIX}`,
		)
		const value = screen.getByRole('definition', { name: LABEL })
		expect(iconSlot).toHaveAttribute('aria-hidden', 'true')
		expect(value).toBeVisible()
	})

	it('omits the icon slot entirely when no icon is given', () => {
		renderComponent()

		const iconSlot = screen.queryByTestId(
			`${STAT_CARD_TESTIDS.BASE}${STAT_CARD_TESTIDS.ICON_SUFFIX}`,
		)
		expect(iconSlot).not.toBeInTheDocument()
	})

	// Announcements: N/A by design. StatCard is a read-out; the game's own live
	// region announces moves, and a second live region here would double-speak.
	it('does not announce its own value changes', () => {
		const { rerender } = renderComponent()
		rerender(<StatCard label={LABEL} value="043" />)

		const statCard = screen.getByTestId(STAT_CARD_TESTIDS.BASE)
		const definition = screen.getByRole('definition')
		expect(statCard).not.toHaveAttribute('aria-live')
		expect(definition).toHaveTextContent('043')
	})

	// Keyboard operation map: empty by design — StatCard is a static read-out.
	it('takes no keyboard focus', async () => {
		const user = userEvent.setup()
		renderComponent()

		const definition = screen.getByRole('definition')
		await user.tab()

		expect(definition).not.toHaveFocus()
		expect(document.body).toHaveFocus()
	})

	it.each(tones)('renders the %s tone without disturbing the readout', (tone) => {
		renderComponent({ tone })

		const value = screen.getByRole('definition', { name: LABEL })
		expect(value).toHaveTextContent(VALUE)
	})

	it('keeps a consumer class name alongside its own', () => {
		renderComponent({ className: 'wide' })

		const statCard = screen.getByTestId(STAT_CARD_TESTIDS.BASE)
		expect(statCard).toHaveClass('wide')
	})

	it('lets a collection override the base testid', () => {
		const overrideTestId = `${STAT_CARD_TESTIDS.BASE}-moves`
		renderComponent({ dataTestId: overrideTestId })

		const statCard = screen.getByTestId(overrideTestId)
		expect(statCard).toBeVisible()
	})
})
