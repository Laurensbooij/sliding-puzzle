import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Vitest globals are off, so RTL can't self-register its cleanup — do it here.
afterEach(cleanup)

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
	HTMLElement.prototype.togglePopover = function togglePopover(options) {
		const force = typeof options === 'boolean' ? options : options?.force
		const shouldOpen = force ?? this.style.display !== 'block'
		if (shouldOpen) this.showPopover()
		else this.hidePopover()
		return shouldOpen
	}
}
