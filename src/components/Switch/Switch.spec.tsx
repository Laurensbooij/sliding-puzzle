import { renderWithProviders } from '@testing'
import { screen } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Switch } from './Switch'
import type { SwitchProps } from './Switch'
import { SWITCH_TESTIDS } from './constants'

const LABEL = 'Show numbers'
const DESCRIPTION = 'Shows the solved picture beside the board'

/**
 * The one render for every case. `label` is always present — a switch without
 * one has no accessible name — so a case only spells out what it varies.
 */
const renderComponent = (props: Partial<SwitchProps> = {}): RenderResult =>
	renderWithProviders(<Switch label={LABEL} {...props} />)

describe('Switch', () => {
	it('is a switch named by its label', () => {
		renderComponent()

		const control = screen.getByRole('switch', { name: LABEL })
		expect(control).toBeVisible()
	})

	it('leaves its description out of the name and exposes it as the description', () => {
		renderComponent({ description: DESCRIPTION })

		const control = screen.getByRole('switch', { name: LABEL })
		expect(control).toHaveAccessibleDescription(DESCRIPTION)
	})

	it('carries no description when none is given', () => {
		renderComponent()

		const control = screen.getByRole('switch', { name: LABEL })
		expect(control).not.toHaveAttribute('aria-describedby')
	})

	it('reports its state through aria-checked, which is what a screen reader announces', async () => {
		const user = userEvent.setup()
		renderComponent()

		const control = screen.getByRole('switch', { name: LABEL })
		expect(control).not.toBeChecked()

		await user.click(control)

		expect(control).toBeChecked()
	})

	it('toggles on Space once tabbed to, and ignores Enter', async () => {
		const user = userEvent.setup()
		const onChange = vi.fn<NonNullable<SwitchProps['onChange']>>()
		renderComponent({ onChange })

		const control = screen.getByRole('switch', { name: LABEL })

		await user.tab()
		expect(control).toHaveFocus()

		await user.keyboard(' ')
		expect(control).toBeChecked()
		expect(onChange).toHaveBeenCalledOnce()

		// Enter belongs to form submission, not to a checkbox.
		await user.keyboard('{Enter}')
		expect(control).toBeChecked()
		expect(onChange).toHaveBeenCalledOnce()

		await user.keyboard(' ')
		expect(control).not.toBeChecked()
	})

	it('toggles when its label text is clicked', async () => {
		const user = userEvent.setup()
		renderComponent({ description: DESCRIPTION })

		const control = screen.getByRole('switch', { name: LABEL })
		const labelText = screen.getByText(LABEL)
		await user.click(labelText)

		expect(control).toBeChecked()
	})

	it('honours a controlled checked value', async () => {
		const user = userEvent.setup()
		const onChange = vi.fn<NonNullable<SwitchProps['onChange']>>()
		renderComponent({ checked: true, onChange })

		const control = screen.getByRole('switch', { name: LABEL })
		expect(control).toBeChecked()

		await user.click(control)

		expect(onChange).toHaveBeenCalledOnce()
		expect(control).toBeChecked()
	})

	it('is neither focusable nor toggleable when disabled', async () => {
		const user = userEvent.setup()
		const onChange = vi.fn<NonNullable<SwitchProps['onChange']>>()
		renderComponent({ disabled: true, onChange })

		const control = screen.getByRole('switch', { name: LABEL })

		await user.tab()
		expect(control).not.toHaveFocus()

		await user.click(control)

		expect(control).not.toBeChecked()
		expect(onChange).not.toHaveBeenCalled()
	})

	it('lets a caller override the base testid', () => {
		const overrideTestId = `settings-${SWITCH_TESTIDS.BASE}-sound`
		renderComponent({ dataTestId: overrideTestId })

		const control = screen.getByTestId(overrideTestId)
		const knob = screen.getByTestId(`${overrideTestId}${SWITCH_TESTIDS.KNOB_SUFFIX}`)
		expect(control).toBeVisible()
		expect(knob).toBeVisible()
	})
})
