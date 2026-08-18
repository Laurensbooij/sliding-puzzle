import { renderWithProviders } from '@testing'
import { screen } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Badge } from './Badge'
import type { BadgeProps } from './Badge'
import { BADGE_TESTIDS } from './constants'

const LABEL = 'Solved'

const tones: BadgeProps['tone'][] = ['neutral', 'accent', 'amber', 'danger', 'inverse']

/**
 * The one render for every case. `children` falls back to a plain label, so a
 * case only spells out what it varies — tone, icon, or the native span props a
 * consumer uses to give the badge a role of its own.
 */
const renderComponent = ({ children = LABEL, ...props }: Partial<BadgeProps> = {}): RenderResult =>
	renderWithProviders(<Badge {...props}>{children}</Badge>)

/**
 * WCAG 2.2 AA determinations for Badge, per docs/conventions/accessibility.md.
 *
 * - Focus (SC 2.4.11) — N/A: static, never focusable, so nothing can obscure it.
 * - Target size (SC 2.5.8) — N/A: not a target; the pill has no pointer action.
 * - Announcements — N/A: renders no state of its own. A consumer that needs one
 *   promotes it with `role="status"`, asserted below.
 * - Reduced motion — N/A: declares no transition or animation.
 */
describe('Badge', () => {
	it('exposes its content as text, in the casing it was given', () => {
		renderComponent()

		const badge = screen.getByText(LABEL)
		expect(badge).toBeVisible()
	})

	it('carries no role of its own until a consumer gives it one', () => {
		renderComponent()

		const badge = screen.getByText(LABEL)
		expect(badge).not.toHaveAttribute('role')
	})

	it('can be promoted to a named status region by its consumer', () => {
		renderComponent({ role: 'status', 'aria-label': 'Board state' })

		const status = screen.getByRole('status', { name: 'Board state' })
		expect(status).toBeVisible()
	})

	it('hides its icon from assistive technology so the text alone carries meaning', () => {
		renderComponent({ icon: <svg /> })

		const iconSlot = screen.getByTestId(`${BADGE_TESTIDS.BASE}${BADGE_TESTIDS.ICON_SUFFIX}`)
		const badge = screen.getByText(LABEL)
		expect(iconSlot).toHaveAttribute('aria-hidden', 'true')
		expect(badge).toHaveTextContent(/^Solved$/)
	})

	it('omits the icon slot entirely when no icon is given', () => {
		renderComponent()

		const iconSlot = screen.queryByTestId(`${BADGE_TESTIDS.BASE}${BADGE_TESTIDS.ICON_SUFFIX}`)
		expect(iconSlot).not.toBeInTheDocument()
	})

	// Keyboard operation map: empty by design — Badge is static, per Figma
	// ("Small status / meta pill. Static — no interaction states.").
	it('takes no keyboard focus', async () => {
		const user = userEvent.setup()
		renderComponent()

		const badge = screen.getByText(LABEL)
		await user.tab()

		expect(badge).not.toHaveFocus()
		expect(document.body).toHaveFocus()
	})

	it.each(tones)('renders the %s tone without disturbing its text', (tone) => {
		renderComponent({ tone })

		const badge = screen.getByText(LABEL)
		expect(badge).toBeVisible()
	})

	it('keeps a consumer class name alongside its own', () => {
		renderComponent({ className: 'pinned' })

		const badge = screen.getByText(LABEL)
		expect(badge).toHaveClass('pinned')
	})

	it('lets a collection override the base testid', () => {
		const overrideTestId = `${BADGE_TESTIDS.BASE}-streak`
		renderComponent({ dataTestId: overrideTestId })

		const badge = screen.getByTestId(overrideTestId)
		expect(badge).toBeVisible()
	})
})
