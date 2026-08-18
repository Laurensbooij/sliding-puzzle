import { renderWithProviders } from '@testing'
import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Icon } from './Icon'
import type { IconName, IconProps } from './Icon'
import { ICON_GLYPHS, ICON_TESTIDS } from './constants'

const iconNames = Object.keys(ICON_GLYPHS) as IconName[]
const iconSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const satisfies NonNullable<IconProps['size']>[]

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

	it.each(iconNames)('renders the %s glyph', (name) => {
		renderWithProviders(<Icon name={name} />)

		const glyph = screen.getByTestId(ICON_TESTIDS.BASE)
		expect(glyph.tagName.toLowerCase()).toBe('svg')
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

	it.each(iconSizes)('reports the %s step of the icon scale', (size) => {
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
