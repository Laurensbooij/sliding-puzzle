import { renderWithProviders } from '@testing'
import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Tooltip } from './Tooltip'
import type { TooltipPlacement, TooltipProps } from './Tooltip'
import { TOOLTIP_TESTIDS } from './constants'

const TRIGGER_NAME = 'Shuffle'
const CONTENT = 'Shuffle the board'
const OWN_DESCRIPTION_ID = 'own-description'
const OWN_DESCRIPTION = 'Randomises the tiles'

/**
 * The one render for every case. Takes the component's own props; `content` and
 * `children` fall back to a plain named button, so a case only spells out the
 * trigger it actually varies.
 *
 * The standing description element is inert unless a trigger points
 * `aria-describedby` at it — one case does, to prove the tooltip composes with a
 * description the trigger already had rather than clobbering it.
 */
const renderComponent = ({
	content = CONTENT,
	children = <button type="button">{TRIGGER_NAME}</button>,
	...props
}: Partial<TooltipProps> = {}) =>
	renderWithProviders(
		<>
			<span id={OWN_DESCRIPTION_ID}>{OWN_DESCRIPTION}</span>
			<Tooltip content={content} {...props}>
				{children}
			</Tooltip>
		</>,
	)

describe('Tooltip', () => {
	it('stays closed until the trigger is hovered or focused', () => {
		renderComponent()

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		const tooltip = screen.queryByRole('tooltip')
		expect(trigger).toBeVisible()
		expect(tooltip).not.toBeInTheDocument()
	})

	it('opens on hover as a tooltip named after its content', async () => {
		const user = userEvent.setup()
		renderComponent()

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.hover(trigger)

		const tooltip = screen.getByRole('tooltip', { name: CONTENT })
		expect(tooltip).toBeVisible()
	})

	it('opens on keyboard focus of the trigger', async () => {
		const user = userEvent.setup()
		renderComponent()

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.tab()

		const tooltip = screen.getByRole('tooltip', { name: CONTENT })
		expect(trigger).toHaveFocus()
		expect(tooltip).toBeVisible()
	})

	it('describes a trigger that has no name of its own, and stops once closed', async () => {
		const user = userEvent.setup()
		renderComponent()

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.hover(trigger)
		expect(trigger).toHaveAccessibleDescription(CONTENT)

		await user.unhover(trigger)
		expect(trigger).not.toHaveAccessibleDescription()
	})

	it('stays out of the accessibility tree when the trigger already carries the same name', async () => {
		const user = userEvent.setup()
		renderComponent({ children: <button type="button" aria-label={CONTENT} /> })

		const trigger = screen.getByRole('button', { name: CONTENT })
		await user.hover(trigger)

		// The chip repeats a name AT already has; describing with it too would
		// announce the same words twice.
		const chip = screen.getByTestId(TOOLTIP_TESTIDS.BASE)
		const announced = screen.queryByRole('tooltip')
		expect(chip).toBeVisible()
		expect(announced).not.toBeInTheDocument()
		expect(trigger).not.toHaveAccessibleDescription()
	})

	it('describes a named trigger anyway when asked to', async () => {
		const user = userEvent.setup()
		renderComponent({
			describesTrigger: true,
			children: <button type="button" aria-label={TRIGGER_NAME} />,
		})

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.hover(trigger)

		const announced = screen.getByRole('tooltip', { name: CONTENT })
		expect(announced).toBeVisible()
		expect(trigger).toHaveAccessibleDescription(CONTENT)
	})

	it('can be told to stay silent for a trigger that has no name of its own', async () => {
		const user = userEvent.setup()
		renderComponent({ describesTrigger: false })

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.hover(trigger)

		expect(trigger).not.toHaveAccessibleDescription()
	})

	it('keeps a description the trigger already had', async () => {
		const user = userEvent.setup()
		renderComponent({
			children: (
				<button type="button" aria-describedby={OWN_DESCRIPTION_ID}>
					{TRIGGER_NAME}
				</button>
			),
		})

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.hover(trigger)

		expect(trigger).toHaveAccessibleDescription(`${OWN_DESCRIPTION} ${CONTENT}`)
	})

	it('strips the trigger of a native title, so only one chip ever shows', () => {
		renderComponent({
			children: (
				<button type="button" title={CONTENT}>
					{TRIGGER_NAME}
				</button>
			),
		})

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		expect(trigger).not.toHaveAttribute('title')
	})

	it('closes when the pointer leaves the trigger', async () => {
		const user = userEvent.setup()
		renderComponent()

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.hover(trigger)
		await user.unhover(trigger)

		const tooltip = screen.queryByRole('tooltip')
		expect(tooltip).not.toBeInTheDocument()
	})

	it('stays open while the pointer travels onto the tooltip itself (WCAG 1.4.13 hoverable)', async () => {
		const user = userEvent.setup()
		renderComponent()

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
		renderComponent()

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
		renderComponent()

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
		renderComponent()

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
		renderComponent()

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.tab()
		expect(trigger).toHaveFocus()

		await user.tab()
		const tooltip = screen.queryByRole('tooltip')
		expect(tooltip).not.toBeInTheDocument()
	})

	it('dismisses on Escape without moving keyboard focus (WCAG 1.4.13 dismissible)', async () => {
		const user = userEvent.setup()
		renderComponent()

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.tab()
		await user.keyboard('{Escape}')

		const tooltip = screen.queryByRole('tooltip')
		expect(tooltip).not.toBeInTheDocument()
		expect(trigger).toHaveFocus()
	})

	it('dismisses on Escape while hovering, with focus elsewhere', async () => {
		const user = userEvent.setup()
		renderComponent()

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
		renderComponent({
			children: (
				<button type="button" onClick={onClick}>
					{TRIGGER_NAME}
				</button>
			),
		})

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.click(trigger)

		expect(onClick).toHaveBeenCalledOnce()
	})

	// Placement is a CSS-module class, not a data attribute
	// (docs/conventions/components.md), and the class names are hashed — so the
	// assertion is that the four placements are told apart in the DOM at all.
	// Which side each one lands on is `position-area`, which jsdom cannot
	// compute; the stories carry that half.
	it('styles each placement distinctly', async () => {
		const user = userEvent.setup()
		const placements: TooltipPlacement[] = ['top', 'right', 'bottom', 'left']
		const classNames: string[] = []

		for (const placement of placements) {
			const { unmount } = renderComponent({ placement })
			const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
			await user.hover(trigger)
			classNames.push(
				screen.getByRole('tooltip', { name: CONTENT }).getAttribute('class') ?? '',
			)
			unmount()
		}

		const distinct = new Set(classNames)
		expect(distinct.size).toBe(placements.length)
	})

	it('lets a consumer override the base testid', async () => {
		const user = userEvent.setup()
		const overrideTestId = `${TOOLTIP_TESTIDS.BASE}-shuffle`
		renderComponent({ dataTestId: overrideTestId })

		const trigger = screen.getByRole('button', { name: TRIGGER_NAME })
		await user.hover(trigger)

		const tooltip = screen.getByTestId(overrideTestId)
		expect(tooltip).toBeVisible()
	})
})
