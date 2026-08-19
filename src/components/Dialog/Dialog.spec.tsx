import { createTranslate } from '@i18n'
import { globalMessages } from '@messages'
import { renderWithProviders } from '@testing'
import type { RenderWithProvidersOptions } from '@testing'
import { screen } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Dialog } from './Dialog'
import type { DialogKind, DialogProps } from './Dialog'
import styles from './Dialog.module.css'
import { DIALOG_KINDS, DIALOG_TESTIDS } from './constants'

const TITLE = 'Solved in 42 moves'
const DESCRIPTION = 'A new best at 4×4.'
const PRIMARY_ACTION = 'Play again'
const SECONDARY_ACTION = 'Try 5 × 5'
const BADGE_TESTID = `${DIALOG_TESTIDS.BASE}${DIALOG_TESTIDS.BADGE_SUFFIX}`

const { translate } = createTranslate()

/**
 * The card as every case renders it: open, titled, and carrying the action pair
 * the win kind is drawn with. Split out from the render helper because the
 * cases that watch the card open and close have to hand the same element back
 * to `rerender`, and restating it there would let the two drift.
 */
const dialogElement = ({
	open = true,
	title = TITLE,
	description = DESCRIPTION,
	actions = (
		<>
			<button type="button">{PRIMARY_ACTION}</button>
			<button type="button">{SECONDARY_ACTION}</button>
		</>
	),
	onClose = vi.fn(),
	...props
}: Partial<DialogProps> = {}): ReactElement => (
	<Dialog
		open={open}
		title={title}
		description={description}
		actions={actions}
		onClose={onClose}
		{...props}
	/>
)

const renderComponent = (
	props: Partial<DialogProps> = {},
	options?: RenderWithProvidersOptions,
): RenderResult => renderWithProviders(dialogElement(props), options)

/**
 * Accessibility criteria the platform answers rather than this component, and
 * the ones that need a browser, recorded rather than skipped
 * (docs/conventions/accessibility.md):
 *
 * - **Focus trap, inert background, focus restore** — native to `showModal()`
 *   (ADR-0011), and none of the three exist in jsdom: the shim in
 *   `vitest.setup.ts` restores open/closed state and Esc, nothing more. The
 *   storybook project runs in Chromium, so those stories are the standing check.
 * - **Focus indicator (SC 2.4.11)** — N/A *for the card*, carried by its
 *   contents. The card is a focus target but never a tab stop, so it takes no
 *   ring; a ring around the whole thing on arrival would read as an error state.
 *   Every control inside keeps its own, and the `FocusedActions` story is what
 *   shows those rings falling inside the card rather than under its edge — the
 *   dialog UA sheet sets `overflow: auto`, which could have clipped them.
 * - **Announcements** — N/A: the card holds no state that changes while it is
 *   open. Its arrival *is* the announcement, which the dialog role and the focus
 *   move below deliver; whatever opened it owns anything further. The ad-hoc
 *   VoiceOver pass accessibility.md asks for when a Dialog lands is a manual
 *   remainder, not something a spec can discharge.
 * - **Target size (SC 2.5.8)** — carried by the controls it composes. Button and
 *   IconButton are 32px square at their smallest, and the `target-size` axe rule
 *   runs over every story.
 * - **Contrast and reduced motion** — Chromium-only. jsdom computes neither, so
 *   the scrim, the badge tones and the token-level motion collapse are all
 *   accepted through the stories.
 */
describe('Dialog', () => {
	it('stays out of view and out of the accessibility tree until it is opened', () => {
		renderComponent({ open: false })

		const card = screen.getByTestId(DIALOG_TESTIDS.BASE)
		const exposed = screen.queryByRole('dialog')
		expect(card).not.toBeVisible()
		expect(exposed).not.toBeInTheDocument()
	})

	it('opens as a dialog named by its title', () => {
		renderComponent()

		const dialog = screen.getByRole('dialog', { name: TITLE })
		expect(dialog).toBeVisible()
	})

	it('renders the title as a heading, so the card has an outline entry of its own', () => {
		renderComponent()

		const heading = screen.getByRole('heading', { name: TITLE })
		expect(heading).toBeVisible()
	})

	it('takes its accessible description from the supporting line', () => {
		renderComponent()

		const dialog = screen.getByRole('dialog', { name: TITLE })
		expect(dialog).toHaveAccessibleDescription(DESCRIPTION)
	})

	// See the component docblock for why the card takes focus rather than the
	// first action.
	it('moves focus onto the card itself when it opens', () => {
		renderComponent()

		const dialog = screen.getByRole('dialog', { name: TITLE })
		expect(dialog).toHaveFocus()
	})

	it('takes focus again each time it re-opens', () => {
		const { rerender } = renderComponent()

		rerender(dialogElement({ open: false }))
		rerender(dialogElement({ open: true }))

		const dialog = screen.getByRole('dialog', { name: TITLE })
		expect(dialog).toHaveFocus()
	})

	it('reaches the actions in order by keyboard from there', async () => {
		const user = userEvent.setup()
		renderComponent()

		const primary = screen.getByRole('button', { name: PRIMARY_ACTION })
		const secondary = screen.getByRole('button', { name: SECONDARY_ACTION })
		await user.tab()
		expect(primary).toHaveFocus()

		await user.tab()
		expect(secondary).toHaveFocus()
	})

	it('runs an action the caller wired up', async () => {
		const user = userEvent.setup()
		const onPlayAgain = vi.fn()
		renderComponent({
			actions: (
				<button type="button" onClick={onPlayAgain}>
					{PRIMARY_ACTION}
				</button>
			),
		})

		const primary = screen.getByRole('button', { name: PRIMARY_ACTION })
		await user.click(primary)

		expect(onPlayAgain).toHaveBeenCalledOnce()
	})

	// Controlled all the way down: `open` is the only thing that closes the
	// card, so Escape is a request its owner grants by withdrawing the prop.
	// Letting the browser close it instead would leave the DOM and the owner's
	// state disagreeing for a render.
	it('asks to be closed on Escape rather than closing itself', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()
		renderComponent({ onClose })

		const dialog = screen.getByRole('dialog', { name: TITLE })
		await user.keyboard('{Escape}')

		expect(onClose).toHaveBeenCalledOnce()
		expect(dialog).toBeVisible()
	})

	it('closes once its owner withdraws the open prop', () => {
		const { rerender } = renderComponent()

		const dialog = screen.getByRole('dialog', { name: TITLE })
		expect(dialog).toBeVisible()

		rerender(dialogElement({ open: false }))
		expect(dialog).not.toBeVisible()
	})

	it('draws no close affordance by default, matching the designed set', () => {
		renderComponent()

		const close = screen.queryByRole('button', { name: translate(globalMessages.close) })
		expect(close).not.toBeInTheDocument()
	})

	it('adds a close control when asked, which asks to be closed the same way', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()
		renderComponent({ dismissible: true, onClose })

		const close = screen.getByRole('button', { name: translate(globalMessages.close) })
		await user.click(close)

		expect(onClose).toHaveBeenCalledOnce()
	})

	it('names its close control in the active locale', () => {
		const { translate: translateDutch } = createTranslate('nl')
		renderComponent({ dismissible: true }, { locale: 'nl' })

		const close = screen.getByRole('button', { name: translateDutch(globalMessages.close) })
		expect(close).toBeVisible()
	})

	// Scroll-lock is one of the two pieces `showModal()` does not supply. The
	// page behind a modal scrolling under the pointer is the classic modal bug.
	it('locks the page behind it from scrolling, and hands the scroll back', () => {
		const { rerender } = renderComponent()

		expect(document.body).toHaveStyle({ overflow: 'hidden' })

		rerender(dialogElement({ open: false }))
		expect(document.body).not.toHaveStyle({ overflow: 'hidden' })
	})

	it('leaves a scroll style the page already had exactly as it found it', () => {
		document.body.style.overflow = 'scroll'
		const { rerender } = renderComponent()

		rerender(dialogElement({ open: false }))

		expect(document.body).toHaveStyle({ overflow: 'scroll' })
		document.body.style.overflow = ''
	})

	// Kind is a designed variant, so it selects a CSS-module class rather than a
	// data attribute (docs/conventions/components.md). Which tone and glyph that
	// class paints is a Chromium question the stories carry.
	it.each<DialogKind>([...DIALOG_KINDS])('badges the %s kind with its own class', (kind) => {
		renderComponent({ kind })

		const badge = screen.getByTestId(BADGE_TESTID)
		expect([...badge.classList]).toContain(styles[kind])
	})

	it('hides the badge from assistive technology — the title carries the meaning', () => {
		renderComponent()

		const badge = screen.getByTestId(BADGE_TESTID)
		const exposedGraphic = screen.queryByRole('img')
		expect(badge).toBeVisible()
		expect(exposedGraphic).not.toBeInTheDocument()
	})

	it('lets a consumer override the base testid, every suffix included', () => {
		const overrideTestId = `${DIALOG_TESTIDS.BASE}-solved`
		renderComponent({ dataTestId: overrideTestId, dismissible: true })

		const card = screen.getByTestId(overrideTestId)
		const badge = screen.getByTestId(`${overrideTestId}${DIALOG_TESTIDS.BADGE_SUFFIX}`)
		const close = screen.getByTestId(`${overrideTestId}${DIALOG_TESTIDS.CLOSE_SUFFIX}`)
		expect(card).toBeVisible()
		expect(badge).toBeVisible()
		expect(close).toBeVisible()
	})

	it('keeps a consumer class name alongside its own', () => {
		const consumerClass = 'solved-card'
		renderComponent({ className: consumerClass })

		const dialog = screen.getByRole('dialog', { name: TITLE })
		expect([...dialog.classList]).toContain(styles.dialog)
		expect([...dialog.classList]).toContain(consumerClass)
	})
})
