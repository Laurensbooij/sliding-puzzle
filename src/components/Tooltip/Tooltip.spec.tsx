import { renderWithProviders } from '@testing'
import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Tooltip } from './Tooltip'
import type { TooltipPlacement, TooltipProps } from './Tooltip'
import { TOOLTIP_TESTIDS } from './constants'

const TRIGGER_NAME = 'Shuffle'
const CONTENT = 'Shuffle the board'

const renderTooltip = (props: Partial<TooltipProps> = {}) =>
	renderWithProviders(
		<Tooltip content={CONTENT} {...props}>
			<button type="button">{TRIGGER_NAME}</button>
		</Tooltip>,
	)

describe('Tooltip', () => {
	it('stays closed until the trigger is hovered or focused', () => {
		renderTooltip()

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		const tooltip = screen.queryByRole('tooltip')
		expect(trigger).toBeVisible()
		expect(tooltip).not.toBeInTheDocument()
	})

	it('opens on hover as a tooltip named after its content', async () => {
		const user = userEvent.setup()
		renderTooltip()

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.hover(trigger)

		const tooltip = screen.getByRole('tooltip', { name: CONTENT })
		expect(tooltip).toBeVisible()
	})

	it('opens on keyboard focus of the trigger', async () => {
		const user = userEvent.setup()
		renderTooltip()

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.tab()

		const tooltip = screen.getByRole('tooltip', { name: CONTENT })
		expect(trigger).toHaveFocus()
		expect(tooltip).toBeVisible()
	})

	it('describes the trigger while open, and stops describing it once closed', async () => {
		const user = userEvent.setup()
		renderTooltip()

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.hover(trigger)
		expect(trigger).toHaveAccessibleDescription(CONTENT)

		await user.unhover(trigger)
		expect(trigger).not.toHaveAccessibleDescription()
	})

	it('keeps a description the trigger already had', async () => {
		const user = userEvent.setup()
		renderWithProviders(
			<>
				<span id="own-description">Randomises the tiles</span>
				<Tooltip content={CONTENT}>
					<button type="button" aria-describedby="own-description">
						{TRIGGER_NAME}
					</button>
				</Tooltip>
			</>,
		)

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.hover(trigger)

		expect(trigger).toHaveAccessibleDescription(`Randomises the tiles ${CONTENT}`)
	})

	it('closes when the pointer leaves the trigger', async () => {
		const user = userEvent.setup()
		renderTooltip()

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.hover(trigger)
		await user.unhover(trigger)

		const tooltip = screen.queryByRole('tooltip')
		expect(tooltip).not.toBeInTheDocument()
	})

	it('stays open while the pointer travels onto the tooltip itself (WCAG 1.4.13 hoverable)', async () => {
		const user = userEvent.setup()
		renderTooltip()

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.hover(trigger)

		const tooltip = screen.getByRole('tooltip', { name: CONTENT })
		await user.hover(tooltip)
		expect(tooltip).toBeVisible()

		await user.unhover(tooltip)
		const dismissed = screen.queryByRole('tooltip')
		expect(dismissed).not.toBeInTheDocument()
	})

	it('stays open when the pointer leaves a trigger that still has focus', async () => {
		const user = userEvent.setup()
		renderTooltip()

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.tab()
		await user.hover(trigger)
		await user.unhover(trigger)

		const tooltip = screen.getByRole('tooltip', { name: CONTENT })
		expect(trigger).toHaveFocus()
		expect(tooltip).toBeVisible()
	})

	it('stays dismissed when the pointer returns to a trigger that still has focus', async () => {
		const user = userEvent.setup()
		renderTooltip()

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.tab()
		await user.keyboard('{Escape}')
		await user.hover(trigger)

		const tooltip = screen.queryByRole('tooltip')
		expect(trigger).toHaveFocus()
		expect(tooltip).not.toBeInTheDocument()
	})

	it('re-opens once hover and focus have both left after a dismissal', async () => {
		const user = userEvent.setup()
		renderTooltip()

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.hover(trigger)
		await user.keyboard('{Escape}')
		await user.unhover(trigger)
		await user.hover(trigger)

		const tooltip = screen.getByRole('tooltip', { name: CONTENT })
		expect(tooltip).toBeVisible()
	})

	it('closes when focus leaves the trigger', async () => {
		const user = userEvent.setup()
		renderTooltip()

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.tab()
		expect(trigger).toHaveFocus()

		await user.tab()
		const tooltip = screen.queryByRole('tooltip')
		expect(tooltip).not.toBeInTheDocument()
	})

	it('dismisses on Escape without moving keyboard focus (WCAG 1.4.13 dismissible)', async () => {
		const user = userEvent.setup()
		renderTooltip()

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.tab()
		await user.keyboard('{Escape}')

		const tooltip = screen.queryByRole('tooltip')
		expect(tooltip).not.toBeInTheDocument()
		expect(trigger).toHaveFocus()
	})

	it('dismisses on Escape while hovering, with focus elsewhere', async () => {
		const user = userEvent.setup()
		renderTooltip()

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.hover(trigger)
		await user.keyboard('{Escape}')

		const tooltip = screen.queryByRole('tooltip')
		expect(tooltip).not.toBeInTheDocument()
		expect(trigger).not.toHaveFocus()
	})

	it('leaves the trigger fully operable', async () => {
		const user = userEvent.setup()
		const onClick = vi.fn()
		renderWithProviders(
			<Tooltip content={CONTENT}>
				<button type="button" onClick={onClick}>
					{TRIGGER_NAME}
				</button>
			</Tooltip>,
		)

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.click(trigger)

		expect(onClick).toHaveBeenCalledOnce()
	})

	it.each<TooltipPlacement>(['top', 'right', 'bottom', 'left'])(
		'renders on the %s of its trigger',
		async (placement) => {
			const user = userEvent.setup()
			renderTooltip({ placement })

			const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
			await user.hover(trigger)

			const tooltip = screen.getByRole('tooltip', { name: CONTENT })
			expect(tooltip).toHaveAttribute('data-placement', placement)
		},
	)

	it('lets a consumer override the base testid', async () => {
		const user = userEvent.setup()
		const overrideTestId = `${TOOLTIP_TESTIDS.BASE}-shuffle`
		renderTooltip({ dataTestId: overrideTestId })

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.hover(trigger)

		const tooltip = screen.getByTestId(overrideTestId)
		expect(tooltip).toBeVisible()
	})
})
