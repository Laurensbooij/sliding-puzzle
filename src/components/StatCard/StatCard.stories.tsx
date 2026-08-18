import type { Meta, StoryObj } from '@storybook/react-vite'

import { StatCard } from './StatCard'

/**
 * Stand-in for the design system's Icon component (a separate ticket): a Lucide
 * `footprints` glyph at the imported 24×24 / stroke-2 geometry, sized by the slot.
 */
const FootprintsGlyph = () => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z" />
		<path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z" />
		<path d="M16 17h4" />
		<path d="M4 13h4" />
	</svg>
)

const meta = {
	title: 'Components/StatCard',
	component: StatCard,
	args: {
		label: 'Moves',
		value: '042',
		icon: <FootprintsGlyph />,
		tone: 'default',
	},
} satisfies Meta<typeof StatCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Accent: Story = {
	args: { tone: 'accent' },
}

/** The only tone allowed on the frame, shown against the wood material it sits on. */
export const OnWood: Story = {
	args: { tone: 'onWood' },
	decorators: [
		(Story) => (
			<div
				style={{
					padding: '1.5rem',
					borderRadius: 'var(--radius-frame)',
					background: 'var(--material-wood)',
					width: 'fit-content',
				}}
			>
				<Story />
			</div>
		),
	],
}

export const WithoutIcon: Story = {
	args: { icon: undefined },
}
