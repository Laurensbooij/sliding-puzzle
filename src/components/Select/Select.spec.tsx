import { renderWithProviders } from '@testing'
import { screen } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Select } from './Select'
import type { SelectProps } from './Select'
import { SELECT_TESTIDS } from './constants'

const LABEL = 'Art pack'

// A tuple, so every assertion reads its expected copy off the fixture instead
// of retyping it, and the destructured options are known to exist.
const options = [
	{ value: 'sailboat', label: 'Sailboat' },
	{ value: 'lighthouse', label: 'Lighthouse' },
	{ value: 'orchard', label: 'Orchard' },
	{ value: 'cityscape', label: 'Cityscape' },
] as const satisfies SelectProps['options']

const [first, second] = options

/**
 * The one render for every case. `label` and `options` are always present — a
 * select without either has nothing to name or to choose from — so a case only
 * spells out what it varies.
 */
const renderComponent = (props: Partial<SelectProps> = {}): RenderResult =>
	renderWithProviders(<Select label={LABEL} options={options} {...props} />)

describe('Select', () => {
	it('is a combobox named by its visible label', () => {
		renderComponent()

		const field = screen.getByRole('combobox', { name: LABEL })
		expect(field).toBeVisible()
	})

	it('ties the label to the field, so clicking the label focuses it', async () => {
		const user = userEvent.setup()
		renderComponent()

		const field = screen.getByRole('combobox', { name: LABEL })
		const labelText = screen.getByText(LABEL)
		await user.click(labelText)

		expect(field).toHaveFocus()
	})

	it('renders one option per entry, in order, named by its label', () => {
		renderComponent()

		const listed = screen.getAllByRole('option')
		expect(listed.map((option) => option.textContent)).toEqual(
			options.map((option) => option.label),
		)
	})

	it('shows the first option when no value is given', () => {
		renderComponent()

		const field = screen.getByRole('combobox', { name: LABEL })
		expect(field).toHaveValue(first.value)
	})

	it('reports the chosen value and honours a controlled one', async () => {
		const user = userEvent.setup()
		const onChange = vi.fn<NonNullable<SelectProps['onChange']>>()
		renderComponent({ value: first.value, onChange })

		const field = screen.getByRole('combobox', { name: LABEL })
		await user.selectOptions(field, second.value)

		expect(onChange).toHaveBeenCalledOnce()
		expect(field).toHaveValue(first.value)
	})

	it('keeps an option listed but unchoosable when it is disabled', () => {
		const placeholder = { value: '', label: 'Choose a pack', disabled: true }
		renderComponent({ options: [placeholder, ...options], defaultValue: '' })

		const listedPlaceholder = screen.getByRole('option', { name: placeholder.label })
		expect(listedPlaceholder).toBeDisabled()
	})

	it('takes one tab stop and changes value from the keyboard', async () => {
		const user = userEvent.setup()
		renderComponent({ defaultValue: first.value })

		const field = screen.getByRole('combobox', { name: LABEL })

		await user.tab()
		expect(field).toHaveFocus()

		// The option list, arrow keys, Home/End, typeahead and Escape are the
		// platform's own — that is the whole point of not hand-rolling a listbox
		// (ADR-0011). jsdom implements none of them, so the keyboard map is
		// verified here only as far as it can be: the control is reachable, and
		// selection through it reaches `onChange`. The rest is the manual pass.
		await user.selectOptions(field, second.value)
		expect(field).toHaveValue(second.value)

		await user.tab()
		expect(field).not.toHaveFocus()
	})

	it('is neither focusable nor changeable when disabled', async () => {
		const user = userEvent.setup()
		const onChange = vi.fn<NonNullable<SelectProps['onChange']>>()
		renderComponent({ disabled: true, defaultValue: first.value, onChange })

		const field = screen.getByRole('combobox', { name: LABEL })

		await user.tab()
		expect(field).not.toHaveFocus()
		expect(field).toBeDisabled()
		expect(onChange).not.toHaveBeenCalled()
	})

	it('announces its value through the native combobox, not a live region', () => {
		renderComponent()

		const field = screen.getByRole('combobox', { name: LABEL })
		const statusRegion = screen.queryByRole('status')
		const alertRegion = screen.queryByRole('alert')

		// N/A for aria-live: the platform announces a select's value on the
		// focused control itself, so a live region would double-announce.
		expect(field).toBeVisible()
		expect(statusRegion).not.toBeInTheDocument()
		expect(alertRegion).not.toBeInTheDocument()
	})

	it('hides the chevron from assistive tech, leaving one name on the field', () => {
		renderComponent()

		const chevron = screen.getByTestId(`${SELECT_TESTIDS.BASE}${SELECT_TESTIDS.CHEVRON_SUFFIX}`)
		expect(chevron).toHaveAttribute('aria-hidden', 'true')
	})

	it('takes a caller-supplied id, so an existing label can already point at it', () => {
		const fieldId = 'setup-art-pack'
		renderComponent({ id: fieldId })

		const field = screen.getByRole('combobox', { name: LABEL })
		expect(field).toHaveAttribute('id', fieldId)
	})

	it('lets a caller override the base testid', () => {
		const overrideTestId = `setup-${SELECT_TESTIDS.BASE}-art-pack`
		renderComponent({ dataTestId: overrideTestId })

		const root = screen.getByTestId(overrideTestId)
		const field = screen.getByTestId(`${overrideTestId}${SELECT_TESTIDS.FIELD_SUFFIX}`)
		const chevron = screen.getByTestId(`${overrideTestId}${SELECT_TESTIDS.CHEVRON_SUFFIX}`)
		expect(root).toBeVisible()
		expect(field).toBeVisible()
		expect(chevron).toBeVisible()
	})
})
