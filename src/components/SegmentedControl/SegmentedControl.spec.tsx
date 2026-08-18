import { renderWithProviders } from '@testing'
import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SegmentedControl } from './SegmentedControl'
import type { SegmentedControlProps } from './SegmentedControl'
import { SEGMENTED_CONTROL_TESTIDS } from './constants'

const GROUP_LABEL = 'Board size'

// A tuple, so the destructured segments are known to exist and every assertion
// can read its expected copy off the fixture instead of retyping it.
const options = [
	{ value: '3', label: '3 × 3' },
	{ value: '4', label: '4 × 4' },
	{ value: '5', label: '5 × 5' },
] as const satisfies SegmentedControlProps['options']

const [first, second, third] = options

const renderControl = (overrides: Partial<SegmentedControlProps> = {}) => {
	const onChange = vi.fn<SegmentedControlProps['onChange']>()
	const view = renderWithProviders(
		<SegmentedControl
			label={GROUP_LABEL}
			options={options}
			value="3"
			onChange={onChange}
			{...overrides}
		/>,
	)

	return { ...view, onChange }
}

describe('SegmentedControl', () => {
	it('is a group named by its label, holding one radio per option', () => {
		renderControl()

		const group = screen.getByRole('group', { name: GROUP_LABEL })
		const radios = screen.getAllByRole('radio')
		expect(group).toBeVisible()
		expect(radios).toHaveLength(options.length)
	})

	it('names each radio after its option label and checks the selected one', () => {
		renderControl({ value: '4' })

		const selected = screen.getByRole('radio', { name: second.label })
		const unselected = screen.getByRole('radio', { name: first.label })
		expect(selected).toBeChecked()
		expect(unselected).not.toBeChecked()
	})

	it('reports the option value when a segment is clicked', async () => {
		const user = userEvent.setup()
		const { onChange } = renderControl()

		const secondSegment = screen.getByRole('radio', { name: second.label })
		await user.click(secondSegment)

		expect(onChange).toHaveBeenCalledExactlyOnceWith('4')
	})

	it('takes a single tab stop, landing on the selected segment', async () => {
		const user = userEvent.setup()
		renderControl({ value: '4' })

		const selected = screen.getByRole('radio', { name: second.label })
		const firstSegment = screen.getByRole('radio', { name: first.label })

		await user.tab()
		expect(selected).toHaveFocus()

		// Tabbing again leaves the group rather than walking to the next segment:
		// the browser's roving-tabindex model, which is why the radios are native.
		await user.tab()
		expect(selected).not.toHaveFocus()
		expect(firstSegment).not.toHaveFocus()
	})

	it.each<[string, string, string]>([
		['{ArrowRight}', '3', '4'],
		['{ArrowDown}', '3', '4'],
		['{ArrowLeft}', '4', '3'],
		['{ArrowUp}', '4', '3'],
		['{ArrowRight}', '5', '3'],
		['{ArrowLeft}', '3', '5'],
	])('moves selection with %s from %s to %s', async (key, from, to) => {
		const user = userEvent.setup()
		const { onChange } = renderControl({ value: from })

		await user.tab()
		await user.keyboard(key)

		expect(onChange).toHaveBeenCalledExactlyOnceWith(to)
	})

	it('selects the focused segment with Space', async () => {
		const user = userEvent.setup()
		const { onChange } = renderControl({ value: '3' })

		const thirdSegment = screen.getByRole('radio', { name: third.label })
		thirdSegment.focus()
		await user.keyboard(' ')

		expect(onChange).toHaveBeenCalledExactlyOnceWith('5')
	})

	it('announces selection through the native radio state, not a live region', () => {
		renderControl({ value: '5' })

		const selected = screen.getByRole('radio', { name: third.label, checked: true })
		const statusRegion = screen.queryByRole('status')
		const alertRegion = screen.queryByRole('alert')

		// N/A for aria-live: a radio's checked state is announced by the platform,
		// so a live region would double-announce every selection.
		expect(selected).toBeVisible()
		expect(statusRegion).not.toBeInTheDocument()
		expect(alertRegion).not.toBeInTheDocument()
	})

	it('disables every segment together and keeps them out of the tab order', async () => {
		const user = userEvent.setup()
		const { onChange } = renderControl({ disabled: true })

		const radios = screen.getAllByRole('radio')
		await user.tab()

		for (const radio of radios) {
			expect(radio).toBeDisabled()
			expect(radio).not.toHaveFocus()
		}
		expect(onChange).not.toHaveBeenCalled()
	})

	it('groups its radios under a name of its own, so two controls never interfere', () => {
		renderWithProviders(
			<>
				<SegmentedControl label="First" options={options} value="3" onChange={vi.fn()} />
				<SegmentedControl label="Second" options={options} value="4" onChange={vi.fn()} />
			</>,
		)

		const firstGroupRadios = screen.getAllByRole('radio', { name: first.label })
		const [firstName, secondName] = firstGroupRadios.map((radio) => radio.getAttribute('name'))
		const checkedRadios = screen.getAllByRole('radio', { checked: true })
		expect(firstName).not.toBe(secondName)
		expect(checkedRadios).toHaveLength(2)
	})

	it('exposes a testid per segment and lets a consumer override the base', () => {
		const overrideTestId = 'setup-board-size'
		renderControl({ dataTestId: overrideTestId })

		const group = screen.getByTestId(overrideTestId)
		const segment = screen.getByTestId(
			`${overrideTestId}${SEGMENTED_CONTROL_TESTIDS.SEGMENT_SUFFIX}-4`,
		)
		expect(group).toBeVisible()
		expect(segment).toBeInTheDocument()
	})
})
