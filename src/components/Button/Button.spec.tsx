import { renderWithProviders } from '@testing'
import { screen } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './Button'
import type { ButtonProps } from './Button'
import { BUTTON_SIZES, BUTTON_TESTIDS, BUTTON_VARIANTS } from './constants'

const LABEL = 'Shuffle'

/**
 * The one render for every case. `children` falls back to a plain label, so a
 * case only spells out what it varies — variant, size, glyphs, or the native
 * button props a consumer reaches through.
 */
const renderComponent = ({ children = LABEL, ...props }: Partial<ButtonProps> = {}): RenderResult =>
	renderWithProviders(<Button {...props}>{children}</Button>)

/**
 * WCAG 2.2 AA determinations for Button, per docs/conventions/accessibility.md.
 *
 * - Announcements — N/A: the button carries no state of its own to announce. A
 *   consumer whose action changes something announces that change at its source.
 * - Focus (SC 2.4.11) and target size (SC 2.5.8) are geometry, so the story layer
 *   proves them in real Chromium: nothing clips the ring, and the smallest size
 *   is a 32px control. What a spec can assert — that focus lands on the button
 *   and never on a disabled one — is asserted below.
 * - Reduced motion — carried at the token layer: every transition here rides
 *   `--transition-control` (ADR-0010).
 */
describe('Button', () => {
	it('is a button named by its children', () => {
		renderComponent()

		const button = screen.getByRole('button', { name: LABEL })
		expect(button).toBeVisible()
	})

	it('defaults to type button, so it never submits a form it happens to sit in', () => {
		renderComponent()

		const button = screen.getByRole('button', { name: LABEL })
		expect(button).toHaveAttribute('type', 'button')
	})

	it('lets a consumer opt into submitting', () => {
		renderComponent({ type: 'submit' })

		const button = screen.getByRole('button', { name: LABEL })
		expect(button).toHaveAttribute('type', 'submit')
	})

	it('calls its handler when clicked', async () => {
		const user = userEvent.setup()
		const onClick = vi.fn()
		renderComponent({ onClick })

		const button = screen.getByRole('button', { name: LABEL })
		await user.click(button)

		expect(onClick).toHaveBeenCalledTimes(1)
	})

	// The full keyboard operation map: tab to reach it, Enter and Space to press.
	it('takes focus on tab', async () => {
		const user = userEvent.setup()
		renderComponent()

		const button = screen.getByRole('button', { name: LABEL })
		await user.tab()

		expect(button).toHaveFocus()
	})

	it.each([
		{ key: '{Enter}', name: 'Enter' },
		{ key: ' ', name: 'Space' },
	])('presses on $name', async ({ key }) => {
		const user = userEvent.setup()
		const onClick = vi.fn()
		renderComponent({ onClick })

		const button = screen.getByRole('button', { name: LABEL })
		await user.tab()
		await user.keyboard(key)

		expect(button).toHaveFocus()
		expect(onClick).toHaveBeenCalledTimes(1)
	})

	it('is skipped by the tab order and refuses clicks when disabled', async () => {
		const user = userEvent.setup()
		const onClick = vi.fn()
		renderComponent({ disabled: true, onClick })

		const button = screen.getByRole('button', { name: LABEL })
		await user.tab()
		await user.click(button)

		expect(button).toBeDisabled()
		expect(button).not.toHaveFocus()
		expect(onClick).not.toHaveBeenCalled()
	})

	it('hides its leading glyph from assistive technology so the label alone names it', () => {
		renderComponent({ iconStart: 'shuffle' })

		const button = screen.getByRole('button', { name: LABEL })
		const glyph = screen.getByTestId(
			`${BUTTON_TESTIDS.BASE}${BUTTON_TESTIDS.ICON_START_SUFFIX}`,
		)
		expect(glyph).toHaveAttribute('aria-hidden', 'true')
		expect(button).toHaveAccessibleName(LABEL)
	})

	it('draws a trailing glyph on the other side of the label', () => {
		renderComponent({ iconEnd: 'chevron-down' })

		const glyph = screen.getByTestId(`${BUTTON_TESTIDS.BASE}${BUTTON_TESTIDS.ICON_END_SUFFIX}`)
		expect(glyph).toHaveAttribute('aria-hidden', 'true')
	})

	it('omits both glyph slots when no icon is named', () => {
		renderComponent()

		const start = screen.queryByTestId(
			`${BUTTON_TESTIDS.BASE}${BUTTON_TESTIDS.ICON_START_SUFFIX}`,
		)
		const end = screen.queryByTestId(`${BUTTON_TESTIDS.BASE}${BUTTON_TESTIDS.ICON_END_SUFFIX}`)
		expect(start).not.toBeInTheDocument()
		expect(end).not.toBeInTheDocument()
	})

	it.each(BUTTON_VARIANTS)('renders the %s variant without disturbing its name', (variant) => {
		renderComponent({ variant })

		const button = screen.getByRole('button', { name: LABEL })
		expect(button).toBeVisible()
	})

	it.each(BUTTON_SIZES)('renders at size %s without disturbing its name', (size) => {
		renderComponent({ size })

		const button = screen.getByRole('button', { name: LABEL })
		expect(button).toBeVisible()
	})

	it('keeps a consumer class name alongside its own', () => {
		renderComponent({ className: 'pinned' })

		const button = screen.getByRole('button', { name: LABEL })
		expect(button).toHaveClass('pinned')
	})

	it('lets a collection override the base testid', () => {
		const overrideTestId = `${BUTTON_TESTIDS.BASE}-reset`
		renderComponent({ dataTestId: overrideTestId, iconStart: 'rotate-ccw' })

		const button = screen.getByTestId(overrideTestId)
		const glyph = screen.getByTestId(`${overrideTestId}${BUTTON_TESTIDS.ICON_START_SUFFIX}`)
		expect(button).toBeVisible()
		expect(glyph).toBeVisible()
	})
})
