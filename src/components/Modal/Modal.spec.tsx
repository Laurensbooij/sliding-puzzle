import { renderWithProviders } from '@testing'
import { screen } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Modal } from './Modal'
import type { ModalProps } from './Modal'
import styles from './Modal.module.css'
import { MODAL_TESTIDS } from './constants'

const TITLE = 'Abandon this game?'
const DESCRIPTION = 'Your moves so far will not be recorded.'
const TITLE_ID = 'modal-spec-title'
const DESCRIPTION_ID = 'modal-spec-description'
const ACTION_LABEL = 'Abandon'
const CONTENT_TESTID = 'modal-spec-content'

/**
 * The shell as every case renders it: open, and carrying the heading and
 * supporting line a card would supply. Split out from the render helper because
 * the cases that watch the shell open and close have to hand the same element
 * back to `rerender`, and restating it there would let the two drift.
 */
const modalElement = ({
	open = true,
	labelledBy = TITLE_ID,
	describedBy = DESCRIPTION_ID,
	onClose = vi.fn(),
	children = (
		<div data-testid={CONTENT_TESTID}>
			<h2 id={TITLE_ID}>{TITLE}</h2>
			<p id={DESCRIPTION_ID}>{DESCRIPTION}</p>
			<button type="button">{ACTION_LABEL}</button>
		</div>
	),
	...props
}: Partial<ModalProps> = {}): ReactElement => (
	<Modal
		open={open}
		labelledBy={labelledBy}
		describedBy={describedBy}
		onClose={onClose}
		{...props}
	>
		{children}
	</Modal>
)

const renderComponent = (props: Partial<ModalProps> = {}): RenderResult =>
	renderWithProviders(modalElement(props))

/**
 * Accessibility criteria the platform answers rather than this component, and
 * the ones that need a browser, recorded rather than skipped
 * (docs/conventions/accessibility.md):
 *
 * - **Focus trap, inert background, focus restore** — native to `showModal()`
 *   (ADR-0011), and none of the three exist in jsdom: the shim in
 *   `vitest.setup.ts` restores open/closed state and Esc, nothing more. The
 *   storybook project runs in Chromium, so those stories are the standing check.
 * - **Focus indicator (SC 2.4.11)** — N/A *for the shell*, carried by its
 *   contents. The shell is a focus target but never a tab stop, so it takes no
 *   ring. Every control inside keeps its own, and the `FocusedContent` story is
 *   what shows those rings falling inside the shell rather than under its edge —
 *   the dialog UA sheet sets `overflow: auto`, which could have clipped them.
 * - **Announcements** — N/A: the shell holds no state of its own. Its arrival
 *   *is* the announcement, which the dialog role and the focus move below
 *   deliver; the card inside owns anything further.
 * - **Target size (SC 2.5.8)** — N/A: the shell renders no control at all, not
 *   even a close button. Whatever a card puts inside it carries this.
 * - **Contrast and reduced motion** — Chromium-only. jsdom computes neither, so
 *   the scrim and the token-level motion collapse are accepted through stories.
 */
describe('Modal', () => {
	it('stays out of view and out of the accessibility tree until it is opened', () => {
		renderComponent({ open: false })

		const shell = screen.getByTestId(MODAL_TESTIDS.BASE)
		const exposed = screen.queryByRole('dialog')
		expect(shell).not.toBeVisible()
		expect(exposed).not.toBeInTheDocument()
	})

	it('opens as a dialog named by the element it was pointed at', () => {
		renderComponent()

		const modal = screen.getByRole('dialog', { name: TITLE })
		expect(modal).toBeVisible()
	})

	it('takes its accessible description from the element it was pointed at', () => {
		renderComponent()

		const modal = screen.getByRole('dialog', { name: TITLE })
		expect(modal).toHaveAccessibleDescription(DESCRIPTION)
	})

	// The shell draws no heading, so it has no name of its own to fall back on.
	// A modal that reached the top layer unnamed would announce itself as a bare
	// "dialog", so the way out of naming it is a type error rather than a prop
	// a caller can forget.
	it('cannot be rendered without an element to be named by', () => {
		// @ts-expect-error labelledBy is required — omitting it must not compile.
		const unnamed = <Modal open onClose={vi.fn()} />

		expect(unnamed).toBeTruthy()
	})

	// See the component docblock for why the shell takes focus rather than the
	// first control inside it.
	it('moves focus onto the shell itself when it opens', () => {
		renderComponent()

		const modal = screen.getByRole('dialog', { name: TITLE })
		expect(modal).toHaveFocus()
	})

	it('takes focus again each time it re-opens', () => {
		const { rerender } = renderComponent()

		rerender(modalElement({ open: false }))
		rerender(modalElement({ open: true }))

		const modal = screen.getByRole('dialog', { name: TITLE })
		expect(modal).toHaveFocus()
	})

	it('reaches the content by keyboard from there', async () => {
		const user = userEvent.setup()
		renderComponent()

		const action = screen.getByRole('button', { name: ACTION_LABEL })
		await user.tab()

		expect(action).toHaveFocus()
	})

	// Controlled all the way down: `open` is the only thing that closes the
	// shell, so Escape is a request its owner grants by withdrawing the prop.
	// Letting the browser close it instead would leave the DOM and the owner's
	// state disagreeing for a render.
	it('asks to be closed on Escape rather than closing itself', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()
		renderComponent({ onClose })

		const modal = screen.getByRole('dialog', { name: TITLE })
		await user.keyboard('{Escape}')

		expect(onClose).toHaveBeenCalledOnce()
		expect(modal).toBeVisible()
	})

	it('closes once its owner withdraws the open prop', () => {
		const { rerender } = renderComponent()

		const modal = screen.getByRole('dialog', { name: TITLE })
		expect(modal).toBeVisible()

		rerender(modalElement({ open: false }))
		expect(modal).not.toBeVisible()
	})

	it('draws no control of its own — the card on top renders its own close', () => {
		renderComponent()

		const controls = screen.getAllByRole('button')
		expect(controls).toHaveLength(1)
		expect(controls[0]).toHaveAccessibleName(ACTION_LABEL)
	})

	// Scroll-lock is one of the two pieces `showModal()` does not supply. The
	// page behind a modal scrolling under the pointer is the classic modal bug.
	it('locks the page behind it from scrolling, and hands the scroll back', () => {
		const { rerender } = renderComponent()

		expect(document.body).toHaveStyle({ overflow: 'hidden' })

		rerender(modalElement({ open: false }))
		expect(document.body).not.toHaveStyle({ overflow: 'hidden' })
	})

	// Unmounting while open is how a card that lives behind a route or a
	// conditional goes away: `open` never turns false, so only the effect
	// cleanup can hand the scroll back.
	it('hands the scroll back when it is unmounted while still open', () => {
		const { unmount } = renderComponent()

		expect(document.body).toHaveStyle({ overflow: 'hidden' })

		unmount()
		expect(document.body).not.toHaveStyle({ overflow: 'hidden' })
	})

	it('leaves a scroll style the page already had exactly as it found it', () => {
		document.body.style.overflow = 'scroll'
		const { rerender } = renderComponent()

		rerender(modalElement({ open: false }))

		expect(document.body).toHaveStyle({ overflow: 'scroll' })
		document.body.style.overflow = ''
	})

	// `::backdrop` is a pseudo-element and takes no listener, so a scrim click
	// arrives as a click whose target is the dialog element itself.
	it('ignores a scrim click by default', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()
		renderComponent({ onClose })

		const modal = screen.getByRole('dialog', { name: TITLE })
		await user.click(modal)

		expect(onClose).not.toHaveBeenCalled()
	})

	it('asks to be closed on a scrim click once scrimClose is on', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()
		renderComponent({ onClose, scrimClose: true })

		const modal = screen.getByRole('dialog', { name: TITLE })
		await user.click(modal)

		expect(onClose).toHaveBeenCalledOnce()
	})

	it('leaves a click on the content alone while scrimClose is on', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()
		renderComponent({ onClose, scrimClose: true })

		const content = screen.getByTestId(CONTENT_TESTID)
		await user.click(content)

		expect(onClose).not.toHaveBeenCalled()
	})

	// A press that starts on the content and releases on the scrim — selecting
	// a line of copy and overshooting — produces a click on the dialog element,
	// exactly like a scrim click. Only where the press began tells them apart.
	it('ignores a click that ends on the scrim but began inside the content', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()
		renderComponent({ onClose, scrimClose: true })

		const modal = screen.getByRole('dialog', { name: TITLE })
		const content = screen.getByTestId(CONTENT_TESTID)
		await user.pointer([
			{ target: content, keys: '[MouseLeft>]' },
			{ target: modal, keys: '[/MouseLeft]' },
		])

		expect(onClose).not.toHaveBeenCalled()
	})

	it('keeps a consumer class name alongside its own', () => {
		const consumerClass = 'settings-card'
		renderComponent({ className: consumerClass })

		const modal = screen.getByRole('dialog', { name: TITLE })
		expect([...modal.classList]).toContain(styles.modal)
		expect([...modal.classList]).toContain(consumerClass)
	})

	it('lets a consumer override the base testid', () => {
		const overrideTestId = `${MODAL_TESTIDS.BASE}-settings`
		renderComponent({ dataTestId: overrideTestId })

		const modal = screen.getByTestId(overrideTestId)
		expect(modal).toBeVisible()
	})
})
