import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

import { installMatchMedia, resetMatchMedia } from './src/testing/match-media'

// Vitest globals are off, so RTL can't self-register its cleanup — do it here.
afterEach(cleanup)

/**
 * jsdom ships no `matchMedia` at all, so anything that subscribes to a media
 * query throws on first render. The fake lives in `@testing` rather than here
 * because a spec has to drive it — flip a query, cross a breakpoint, count the
 * listeners left behind. Reached by path rather than by its `@testing` alias:
 * this file sits outside every tsconfig's `include`, so nothing resolves the
 * aliases for it.
 */
installMatchMedia()
afterEach(resetMatchMedia)

/**
 * jsdom ships the popover UA stylesheet but not the popover API, so a
 * `[popover]` element is stuck at `display: none` and no query can ever see it.
 * Fill the gap with the smallest shim that restores observable open/closed
 * state: an inline display beats the UA rule, so `getByRole` and `toBeVisible`
 * behave as they do in a browser. Real top-layer behaviour is covered by the
 * storybook project, which runs in Chromium.
 */
if (typeof HTMLElement !== 'undefined' && !HTMLElement.prototype.showPopover) {
	HTMLElement.prototype.showPopover = function showPopover() {
		this.style.display = 'block'
	}
	HTMLElement.prototype.hidePopover = function hidePopover() {
		this.style.display = 'none'
	}
}

/**
 * jsdom 27 reflects `<dialog open>` and ships the UA rule that hides a closed
 * one, but implements none of the methods: no `showModal`, no `close`, no
 * `close`/`cancel` events, and no Esc handling. Without a shim every dialog
 * spec would assert against an element that can never open.
 *
 * Deliberately thin, in the same spirit as the popover shim above. It restores
 * observable open/closed state and the Esc route, and nothing else: there is no
 * top layer, no `::backdrop`, no inert background, no focus trap, and
 * `showModal` never throws where the real one would. Every one of those is
 * browser behaviour the component leans on rather than implements, so the
 * storybook project in Chromium is what proves them.
 */
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
	const cancelListeners = new WeakMap<HTMLDialogElement, (event: KeyboardEvent) => void>()

	HTMLDialogElement.prototype.showModal = function showModal() {
		this.setAttribute('open', '')

		// The UA closes a modal dialog on Esc, firing a cancelable `cancel`
		// first. Listening on the document rather than the element because
		// jsdom has no top layer to focus into, so the key event may land
		// anywhere.
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape' || !this.open) return
			// dispatchEvent returns false only when a listener called
			// preventDefault, which is exactly the UA's "stay open" contract.
			const proceed = this.dispatchEvent(new Event('cancel', { cancelable: true }))
			if (proceed) this.close()
		}
		cancelListeners.set(this, onKeyDown)
		this.ownerDocument.addEventListener('keydown', onKeyDown)
	}

	HTMLDialogElement.prototype.close = function close(returnValue?: string) {
		if (!this.open) return
		if (returnValue !== undefined) this.returnValue = returnValue
		this.removeAttribute('open')

		const onKeyDown = cancelListeners.get(this)
		if (onKeyDown) {
			this.ownerDocument.removeEventListener('keydown', onKeyDown)
			cancelListeners.delete(this)
		}

		this.dispatchEvent(new Event('close'))
	}
}

/**
 * Node 24 ships its own experimental `localStorage` global, inert unless the
 * process was started with `--localstorage-file`. Vitest's jsdom environment
 * skips any window key that already exists on `globalThis`, so Node's inert one
 * wins and jsdom's real Storage never becomes reachable — `localStorage` is
 * `undefined` in every jsdom spec.
 *
 * The shim is the smallest thing that restores the observable contract the
 * persisted-state hook is written against: string in, string out, per-key
 * isolation, and a `clear()` between tests. No quota, no `storage` events.
 */
if (globalThis.localStorage === undefined) {
	const entries = new Map<string, string>()

	const memoryStorage: Storage = {
		get length() {
			return entries.size
		},
		key: (index: number) => [...entries.keys()][index] ?? null,
		getItem: (key: string) => entries.get(key) ?? null,
		setItem: (key: string, value: string) => void entries.set(key, String(value)),
		removeItem: (key: string) => void entries.delete(key),
		clear: () => entries.clear(),
	}

	Object.defineProperty(globalThis, 'localStorage', {
		configurable: true,
		value: memoryStorage,
	})
}

// Storage outlives a render, so it needs clearing like the DOM does — otherwise
// one spec's stored preferences become the next spec's starting state.
afterEach(() => localStorage.clear())
