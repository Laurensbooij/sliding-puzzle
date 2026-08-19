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

/** The shell as every case renders it: open, with a heading and supporting
 * line a card would supply. Kept separate from the render helper so cases
 * that `rerender` can reuse the same element. */
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
 * Accessibility items answered elsewhere (docs/conventions/accessibility.md):
 * focus trap, inert background and focus restore are native to `showModal()`
 * and checked in the Chromium stories, not here. Focus indicator, target size
 * and announcements are N/A for the shell — it renders no control and no
 * state of its own. Contrast and reduced motion are Chromium-only checks.
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

	it('cannot be rendered without an element to be named by', () => {
		// @ts-expect-error labelledBy is required — omitting it must not compile.
		const unnamed = <Modal open onClose={vi.fn()} />

		expect(unnamed).toBeTruthy()
	})

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

	it('locks the page behind it from scrolling, and hands the scroll back', () => {
		const { rerender } = renderComponent()

		expect(document.body).toHaveStyle({ overflow: 'hidden' })

		rerender(modalElement({ open: false }))
		expect(document.body).not.toHaveStyle({ overflow: 'hidden' })
	})

	// Covers a card that unmounts without `open` ever turning false.
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

	// A press that starts inside the content and ends on the scrim looks like a
	// scrim click too; only the press origin tells them apart.
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
