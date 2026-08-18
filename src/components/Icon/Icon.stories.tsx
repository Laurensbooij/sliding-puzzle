import type { Meta, StoryObj } from '@storybook/react-vite'

import { Icon } from './Icon'
import type { IconName, IconSize } from './Icon'
import { ICON_GLYPHS } from './constants'

const iconNames = Object.keys(ICON_GLYPHS) as IconName[]
const iconSizes: IconSize[] = ['xs', 'sm', 'md', 'lg', 'xl']

const meta = {
	title: 'Components/Icon',
	component: Icon,
	args: {
		name: 'shuffle',
		size: 'md',
	},
	argTypes: {
		name: { control: 'select', options: iconNames },
		size: { control: 'inline-radio', options: iconSizes },
	},
} satisfies Meta<typeof Icon>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** The full designed set — 26 stock Lucide glyphs, drawn at the default md step. */
export const GlyphSet: Story = {
	render: () => (
		<ul
			style={{
				display: 'flex',
				flexWrap: 'wrap',
				gap: 'var(--space-3)',
				margin: 0,
				padding: 0,
				listStyle: 'none',
			}}
		>
			{iconNames.map((name) => (
				<li
					key={name}
					style={{
						display: 'grid',
						gap: 'var(--space-1)',
						justifyItems: 'center',
						width: '5rem',
						color: 'var(--text-body)',
					}}
				>
					<Icon name={name} />
					<span style={{ font: 'var(--label)', color: 'var(--text-muted)' }}>{name}</span>
				</li>
			))}
		</ul>
	),
}

/** Every step of the icon scale: xs 14 · sm 16 · md 20 · lg 24 · xl 32. */
export const Scale: Story = {
	render: () => (
		<div
			style={{
				display: 'flex',
				alignItems: 'flex-end',
				gap: 'var(--space-5)',
				color: 'var(--text-body)',
			}}
		>
			{iconSizes.map((size) => (
				<div
					key={size}
					style={{ display: 'grid', gap: 'var(--space-1)', justifyItems: 'center' }}
				>
					<Icon name="trophy" size={size} />
					<span style={{ font: 'var(--label)', color: 'var(--text-muted)' }}>{size}</span>
				</div>
			))}
		</div>
	),
}

/** The glyph is drawn in `currentColor`, so it takes the colour of its context. */
export const InheritsColour: Story = {
	render: () => (
		<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
			{(
				[
					['check', 'var(--text-accent)'],
					['trophy', 'var(--text-reward)'],
					['x', 'var(--text-danger)'],
					['info', 'var(--text-muted)'],
				] as const satisfies [IconName, string][]
			).map(([name, color]) => (
				<span key={name} style={{ display: 'inline-flex', color }}>
					<Icon name={name} size="lg" />
				</span>
			))}
		</div>
	),
}

/**
 * Decorative by default: beside its own label the glyph is hidden from
 * assistive technology, so the row reads once rather than twice.
 */
export const Decorative: Story = {
	render: () => (
		<p
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 'var(--space-2)',
				margin: 0,
				font: 'var(--body)',
				color: 'var(--text-body)',
			}}
		>
			<Icon name="footprints" />
			{'128 moves'}
		</p>
	),
}

/** Standing alone, the glyph carries the meaning — so it takes an accessible name. */
export const Labelled: Story = {
	args: { name: 'trophy', size: 'lg', label: 'Personal best' },
}
