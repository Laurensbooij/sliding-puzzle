import { Button } from '@components/Button'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { FC, ReactNode } from 'react'

import { Modal } from './Modal'
import styles from './Modal.stories.module.css'

const TITLE = 'Settings'
const TITLE_ID = 'modal-story-title'
const DESCRIPTION_ID = 'modal-story-description'
const DISMISS_LABEL = 'Done'

/** The page the shell covers — the only way to see the scrim's 3px blur work. */
const PageBehind: FC = () => (
	<div className={styles.page}>
		<p>Moves 42 · 03:18</p>
	</div>
)

/** Stand-in for a designed card — deliberately not `Dialog`, since these
 * stories are about the shell rather than any one card. */
const DemoCard: FC<{ children?: ReactNode }> = ({ children }) => (
	<div className={styles.card}>
		<h2 id={TITLE_ID} className={styles.title}>
			{TITLE}
		</h2>
		<p id={DESCRIPTION_ID} className={styles.description}>
			Sound, reduced motion and the tile numbers, each remembered between games.
		</p>
		<div className={styles.actions}>{children}</div>
	</div>
)

const meta = {
	title: 'Components/Modal',
	component: Modal,
	args: {
		open: true,
		labelledBy: TITLE_ID,
		describedBy: DESCRIPTION_ID,
		onClose: () => {},
		children: (
			<DemoCard>
				<Button variant="primary">{DISMISS_LABEL}</Button>
			</DemoCard>
		),
	},
	decorators: [
		(Story) => (
			<>
				<PageBehind />
				<Story />
			</>
		),
	],
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

/** The shell centring its content over the blurred scrim, and nothing more. */
export const Default: Story = {}

/** Checks the shell's `overflow: auto` doesn't clip focus rings inside it
 * (SC 2.4.11) — the same clipping box that once ate Tooltip's hover bridge. */
export const FocusedContent: Story = {
	parameters: { pseudo: { focusVisible: true } },
}
