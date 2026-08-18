import { renderWithProviders } from '@testing'
import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Card } from './Card'
import type { CardProps } from './Card'
import { CARD_TESTIDS } from './constants'

const paddings: CardProps['padding'][] = ['none', 'sm', 'md', 'lg']

describe('Card', () => {
	it('renders its children', () => {
		renderWithProviders(
			<Card>
				<h2>Records</h2>
			</Card>,
		)

		const heading = screen.getByRole('heading', { name: 'Records' })
		expect(heading).toBeVisible()
	})

	it('is a region named by the label its consumer gives it', () => {
		renderWithProviders(
			<Card aria-label="Records">
				<p>Solve a puzzle and it lands here.</p>
			</Card>,
		)

		const region = screen.getByRole('region', { name: 'Records' })
		expect(region).toBeVisible()
	})

	it('stays an unnamed generic container when no label is given', () => {
		renderWithProviders(<Card>Records</Card>)

		const region = screen.queryByRole('region')
		expect(region).not.toBeInTheDocument()
	})

	// Keyboard operation map: empty by design — Card is a panel, not a control.
	// Focus belongs to whatever the consumer nests inside it.
	it('takes no focus itself and leaves its children keyboard-reachable', async () => {
		const user = userEvent.setup()
		renderWithProviders(
			<Card>
				<button type="button">Play again</button>
			</Card>,
		)

		const card = screen.getByTestId(CARD_TESTIDS.BASE)
		const playAgain = screen.getByRole('button', { name: 'Play again' })
		await user.tab()

		expect(card).not.toHaveFocus()
		expect(playAgain).toHaveFocus()
	})

	it.each(paddings)('renders the %s padding step', (padding) => {
		renderWithProviders(<Card padding={padding}>Records</Card>)

		const card = screen.getByTestId(CARD_TESTIDS.BASE)
		expect(card).toBeVisible()
	})

	it('renders raised', () => {
		renderWithProviders(<Card raised>Records</Card>)

		const card = screen.getByTestId(CARD_TESTIDS.BASE)
		expect(card).toBeVisible()
	})

	it('keeps a consumer class name alongside its own', () => {
		renderWithProviders(<Card className="wide">Records</Card>)

		const card = screen.getByTestId(CARD_TESTIDS.BASE)
		expect(card).toHaveClass('wide')
	})

	it('lets a collection override the base testid', () => {
		const overrideTestId = `${CARD_TESTIDS.BASE}-records`
		renderWithProviders(<Card dataTestId={overrideTestId}>Records</Card>)

		const card = screen.getByTestId(overrideTestId)
		expect(card).toBeVisible()
	})
})
