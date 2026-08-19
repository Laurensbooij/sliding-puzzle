import { ICON_TESTIDS } from '@components/Icon'
import { createTranslate } from '@i18n'
import { globalMessages } from '@messages'
import { renderWithProviders } from '@testing'
import type { RenderWithProvidersOptions } from '@testing'
import { screen } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { IconButton } from './IconButton'
import type { IconButtonProps, IconButtonSize, IconButtonVariant } from './IconButton'
import styles from './IconButton.module.css'
import { ICON_BUTTON_SIZES, ICON_BUTTON_TESTIDS, ICON_BUTTON_VARIANTS } from './constants'

const LABEL = 'Shuffle the board'

const renderComponent = (
	props: Partial<IconButtonProps> = {},
	options?: RenderWithProvidersOptions,
): RenderResult =>
	renderWithProviders(<IconButton icon="shuffle" label={LABEL} {...props} />, options)

describe('IconButton', () => {
	it('is a button named by its label', () => {
		renderComponent()

		const button = screen.getByRole('button', { name: LABEL })
		expect(button).toBeVisible()
	})

	it('takes the caller its translated label, so the name follows the locale', () => {
		const { translate } = createTranslate('nl')
		renderComponent({ label: translate(globalMessages.appName) }, { locale: 'nl' })

		const button = screen.getByRole('button', {
			name: translate(globalMessages.appName),
		})
		expect(button).toBeVisible()
	})

	it('draws its glyph decoratively, so the name is announced once', () => {
		renderComponent()

		// A decorative glyph has no accessible identity by design, so the testid
		// is the only handle on it (ADR-0005).
		const glyph = screen.getByTestId(ICON_TESTIDS.BASE)
		expect(glyph).toHaveAttribute('aria-hidden', 'true')
	})

	// The full keyboard map of a native button: Tab reaches it, Enter and Space
	// activate it, and nothing is reimplemented so both come for free.
	it('is reachable by Tab', async () => {
		const user = userEvent.setup()
		renderComponent()

		const button = screen.getByRole('button', { name: LABEL })
		await user.tab()

		expect(button).toHaveFocus()
	})

	it.each([
		['Enter', '{Enter}'],
		['Space', ' '],
	])('activates on %s', async (_key, sequence) => {
		const user = userEvent.setup()
		const onClick = vi.fn()
		renderComponent({ onClick })

		const button = screen.getByRole('button', { name: LABEL })
		await user.tab()
		await user.keyboard(sequence)

		expect(button).toHaveFocus()
		expect(onClick).toHaveBeenCalledOnce()
	})

	it('activates on click', async () => {
		const user = userEvent.setup()
		const onClick = vi.fn()
		renderComponent({ onClick })

		const button = screen.getByRole('button', { name: LABEL })
		await user.click(button)

		expect(onClick).toHaveBeenCalledOnce()
	})

	it('never submits a form it happens to sit in', () => {
		renderComponent()

		const button = screen.getByRole('button', { name: LABEL })
		expect(button).toHaveAttribute('type', 'button')
	})

	it('shows the label as a tooltip on hover', async () => {
		const user = userEvent.setup()
		renderComponent()

		const button = screen.getByRole('button', { name: LABEL })
		await user.hover(button)

		const tooltip = screen.getByTestId(
			`${ICON_BUTTON_TESTIDS.BASE}${ICON_BUTTON_TESTIDS.TOOLTIP_SUFFIX}`,
		)
		expect(tooltip).toBeVisible()
		expect(tooltip).toHaveTextContent(LABEL)
	})

	it('shows the label as a tooltip on keyboard focus', async () => {
		const user = userEvent.setup()
		renderComponent()

		const button = screen.getByRole('button', { name: LABEL })
		await user.tab()

		const tooltip = screen.getByTestId(
			`${ICON_BUTTON_TESTIDS.BASE}${ICON_BUTTON_TESTIDS.TOOLTIP_SUFFIX}`,
		)
		expect(button).toHaveFocus()
		expect(tooltip).toBeVisible()
	})

	// The chip repeats the name the button already carries. Announcing it as a
	// description too would read the same words twice.
	it('keeps the tooltip out of the accessibility tree', async () => {
		const user = userEvent.setup()
		renderComponent()

		const button = screen.getByRole('button', { name: LABEL })
		await user.hover(button)

		const announced = screen.queryByRole('tooltip')
		expect(announced).not.toBeInTheDocument()
		expect(button).not.toHaveAccessibleDescription()
	})

	it('hides the tooltip once the pointer leaves', async () => {
		const user = userEvent.setup()
		renderComponent()

		const button = screen.getByRole('button', { name: LABEL })
		await user.hover(button)
		await user.unhover(button)

		// The chip stays mounted and leaves the top layer, so that its exit fade
		// can run — "closed" is not visible, not absent.
		const tooltip = screen.getByTestId(
			`${ICON_BUTTON_TESTIDS.BASE}${ICON_BUTTON_TESTIDS.TOOLTIP_SUFFIX}`,
		)
		expect(tooltip).not.toBeVisible()
	})

	it('does not activate while disabled', async () => {
		const user = userEvent.setup()
		const onClick = vi.fn()
		renderComponent({ disabled: true, onClick })

		const button = screen.getByRole('button', { name: LABEL })
		await user.click(button)

		expect(button).toBeDisabled()
		expect(onClick).not.toHaveBeenCalled()
	})

	// Variant and size are designed variants, so each selects its own CSS-module
	// class (docs/conventions/components.md). What those classes paint is the
	// stories' half — jsdom computes no styles.
	it.each<IconButtonVariant>([...ICON_BUTTON_VARIANTS])('renders the %s variant', (variant) => {
		renderComponent({ variant })

		const button = screen.getByRole('button', { name: LABEL })
		expect([...button.classList]).toContain(styles[variant])
	})

	it.each<IconButtonSize>([...ICON_BUTTON_SIZES])('renders at size %s', (size) => {
		renderComponent({ size })

		const button = screen.getByRole('button', { name: LABEL })
		expect([...button.classList]).toContain(styles[size])
	})

	it('lets a consumer override the base testid, tooltip included', async () => {
		const user = userEvent.setup()
		const overrideTestId = `${ICON_BUTTON_TESTIDS.BASE}-shuffle`
		renderComponent({ dataTestId: overrideTestId })

		const button = screen.getByTestId(overrideTestId)
		await user.hover(button)

		const tooltip = screen.getByTestId(`${overrideTestId}${ICON_BUTTON_TESTIDS.TOOLTIP_SUFFIX}`)
		expect(button).toBeVisible()
		expect(tooltip).toBeVisible()
	})
})
