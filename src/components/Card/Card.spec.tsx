import { renderWithProviders } from '@testing'
import { screen } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Card } from './Card'
import type { CardProps } from './Card'
import { CARD_TESTIDS } from './constants'

const CONTENT = 'Records'

const paddings: CardProps['padding'][] = ['none', 'sm', 'md', 'lg']

/**
 * The one render for every case. `children` falls back to plain text, so a case
 * spells out markup only when it needs something the panel wraps — a heading, or
 * a focusable child.
 */
const renderComponent = ({ children = CONTENT, ...props }: Partial<CardProps> = {}): RenderResult =>
	renderWithProviders(<Card {...props}>{children}</Card>)

/**
 * WCAG 2.2 AA determinations for Card, per docs/conventions/accessibility.md.
 *
 * - Focus (SC 2.4.11) — N/A: never focusable itself, and it neither overlays nor
 *   scrolls its children, so it cannot obscure their focus rings.
 * - Target size (SC 2.5.8) — N/A: a panel, not a target.
 * - Announcements — N/A: holds no state of its own.
 * - Reduced motion — N/A: declares no transition or animation.
 */
describe('Card', () => {
	it('renders its children', () => {
		renderComponent({ children: <h2>{CONTENT}</h2> })

		const heading = screen.getByRole('heading', { name: CONTENT })
		expect(heading).toBeVisible()
	})

	it('is a region named by the label its consumer gives it', () => {
		renderComponent({
			'aria-label': CONTENT,
			children: <p>Solve a board and it lands here.</p>,
		})

		const region = screen.getByRole('region', { name: CONTENT })
		expect(region).toBeVisible()
	})

	it('stays an unnamed generic container when no label is given', () => {
		renderComponent()

		const region = screen.queryByRole('region')
		expect(region).not.toBeInTheDocument()
	})

	// Keyboard operation map: empty by design — Card is a panel, not a control.
	// Focus belongs to whatever the consumer nests inside it.
	it('takes no focus itself and leaves its children keyboard-reachable', async () => {
		const user = userEvent.setup()
		renderComponent({
			'aria-label': CONTENT,
			children: <button type="button">Play again</button>,
		})

		const card = screen.getByRole('region', { name: CONTENT })
		const playAgain = screen.getByRole('button', { name: 'Play again' })
		await user.tab()

		expect(card).not.toHaveFocus()
		expect(playAgain).toHaveFocus()
	})

	it.each(paddings)('renders the %s padding step around its children', (padding) => {
		renderComponent({ padding })

		const card = screen.getByText(CONTENT)
		expect(card).toBeVisible()
	})

	it('renders raised', () => {
		renderComponent({ raised: true })

		const card = screen.getByText(CONTENT)
		expect(card).toBeVisible()
	})

	it('keeps a consumer class name alongside its own', () => {
		renderComponent({ className: 'wide' })

		const card = screen.getByText(CONTENT)
		expect(card).toHaveClass('wide')
	})

	it('lets a collection override the base testid', () => {
		const overrideTestId = `${CARD_TESTIDS.BASE}-records`
		renderComponent({ dataTestId: overrideTestId })

		const card = screen.getByTestId(overrideTestId)
		expect(card).toBeVisible()
	})
})
