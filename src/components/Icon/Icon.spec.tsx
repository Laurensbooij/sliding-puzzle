import { renderWithProviders } from '@testing'
import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Icon } from './Icon'
import type { IconName } from './Icon'
import { ICON_GLYPHS, ICON_SIZES, ICON_TESTIDS } from './constants'

const iconNames = Object.keys(ICON_GLYPHS) as IconName[]

/**
 * Accessibility criteria that do not apply to a non-interactive graphic, recorded
 * rather than skipped (docs/conventions/accessibility.md):
 *
 * - **Focus indicator (SC 2.4.11)** — N/A: an Icon is never focusable. The
 *   tab-order case below is what holds that true; the control wrapping it
 *   (Button, IconButton) owns the visible focus ring.
 * - **Announcements** — N/A: an Icon holds no state, so there is nothing for a
 *   live region to announce. Its glyph changes only when its consumer re-renders it.
 * - **Target size (SC 2.5.8)** — N/A: an Icon is not a target. The storybook axe
 *   scan runs with `target-size` enabled, so a story that ever made one
 *   interactive would fail rather than pass quietly.
 */
describe('Icon', () => {
	it('is decorative by default — hidden from assistive technology', () => {
		renderWithProviders(<Icon name="shuffle" />)

		const glyph = screen.getByTestId(ICON_TESTIDS.BASE)
		const exposedGraphic = screen.queryByRole('img')
		expect(glyph).toHaveAttribute('aria-hidden', 'true')
		expect(exposedGraphic).not.toBeInTheDocument()
	})

	it('takes an accessible name when the glyph carries the meaning', () => {
		const label = 'Shuffle the board'
		renderWithProviders(<Icon name="shuffle" label={label} />)

		const glyph = screen.getByRole('img', { name: label })
		expect(glyph).toBeVisible()
		expect(glyph).not.toHaveAttribute('aria-hidden')
	})

	it('maps every designed name to a distinct glyph', () => {
		renderWithProviders(
			<>
				{iconNames.map((name) => (
					<Icon key={name} name={name} dataTestId={`${ICON_TESTIDS.BASE}-${name}`} />
				))}
			</>,
		)

		const drawings = iconNames.map(
			(name) => screen.getByTestId(`${ICON_TESTIDS.BASE}-${name}`).innerHTML,
		)
		expect(new Set(drawings).size).toBe(iconNames.length)
	})

	it.each(ICON_SIZES)('reports the %s step of the icon scale', (size) => {
		renderWithProviders(<Icon name="trophy" size={size} />)

		const glyph = screen.getByTestId(ICON_TESTIDS.BASE)
		expect(glyph).toHaveAttribute('data-size', size)
	})

	it('defaults to the md step', () => {
		renderWithProviders(<Icon name="trophy" />)

		const glyph = screen.getByTestId(ICON_TESTIDS.BASE)
		expect(glyph).toHaveAttribute('data-size', 'md')
	})

	// Keyboard operation map: an Icon has none. It is a graphic, never a control
	// — the surrounding Button/IconButton owns focus, activation and target size.
	it('stays out of the tab order, labelled or not', async () => {
		const user = userEvent.setup()
		renderWithProviders(
			<>
				<Icon name="settings" />
				<Icon name="trophy" label="Personal best" dataTestId={ICON_TESTIDS.BASE} />
				<button type="button">{'after'}</button>
			</>,
		)

		const nextControl = screen.getByRole('button', { name: 'after' })
		await user.tab()

		expect(nextControl).toHaveFocus()
	})

	it('lets a collection override the base testid', () => {
		const overrideTestId = `badge-${ICON_TESTIDS.BASE}`
		renderWithProviders(<Icon name="flame" dataTestId={overrideTestId} />)

		const glyph = screen.getByTestId(overrideTestId)
		expect(glyph).toBeVisible()
	})

	it('adds a consumer class on top of its own styling rather than replacing it', () => {
		const consumerClass = 'badgeGlyph'
		const plainTestId = `plain-${ICON_TESTIDS.BASE}`
		renderWithProviders(
			<>
				<Icon name="check" dataTestId={plainTestId} />
				<Icon name="check" className={consumerClass} />
			</>,
		)

		const plainGlyph = screen.getByTestId(plainTestId)
		const styledGlyph = screen.getByTestId(ICON_TESTIDS.BASE)
		const ownClasses = [...plainGlyph.classList]

		expect(styledGlyph).toHaveClass(...ownClasses)
		expect(styledGlyph).toHaveClass(consumerClass)
	})
})
