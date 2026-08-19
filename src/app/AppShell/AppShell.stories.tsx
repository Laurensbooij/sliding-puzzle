import type { Meta, StoryObj } from '@storybook/react-vite'
import type { FC } from 'react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { INITIAL_VIEWPORTS } from 'storybook/viewport'

import { AppShell } from './AppShell'

/** Stands in for a screen so the shell's gutters and cap have something to hold. */
const DemoScreen: FC = () => (
	<div style={{ paddingBlock: 'var(--space-6)', color: 'var(--text-body)' }}>
		<h1 style={{ font: 'var(--title)' }}>Screen heading</h1>
		<p style={{ marginBlockStart: 'var(--space-4)' }}>
			Every screen renders here, inside `page-content`. The gutter is 16px below the desktop
			breakpoint and 40px above it, and the content stops widening at the layout cap.
		</p>
	</div>
)

const storyRoutes = [{ Component: AppShell, children: [{ index: true, Component: DemoScreen }] }]

const meta = {
	title: 'App/AppShell',
	component: AppShell,
	parameters: {
		layout: 'fullscreen',
		viewport: { options: INITIAL_VIEWPORTS },
	},
	render: () => <RouterProvider router={createMemoryRouter(storyRoutes)} />,
} satisfies Meta<typeof AppShell>

export default meta
type Story = StoryObj<typeof meta>

/** Figma's 390px frames: 16px gutters, header slot above the content. */
export const Mobile: Story = {
	globals: { viewport: { value: 'mobile1', isRotated: false } },
}

/** Figma's 1000px frames: 40px gutters, content centred under the layout cap. */
export const Desktop: Story = {}
