import type { IconSize } from '@components/Icon'

export const BUTTON_TESTIDS = {
	BASE: 'button',
	ICON_START_SUFFIX: '-icon-start',
	ICON_END_SUFFIX: '-icon-end',
} as const

/** Steps of the size scale, smallest first. */
export const BUTTON_SIZES = ['sm', 'md', 'lg'] as const

/** Variants of the design set, in the order the Figma grid lists them. */
export const BUTTON_VARIANTS = ['primary', 'secondary', 'ghost', 'soft', 'danger'] as const

/**
 * The button owns its glyph size — a caller passes a name, not a node, so it
 * never has to know which step goes with which control height.
 *
 * Figma draws 15 · 18 · 20; the icon scale (ADR-0010) offers 16 · 20 · 24, so md
 * and lg both land on 20. Rounding md down to 16 would cost the same 2px against
 * the design and flatten sm/md instead, and there is no `icon-size` variable
 * collection to mirror a literal 18 from.
 */
export const BUTTON_ICON_SIZES = {
	sm: 'sm',
	md: 'md',
	lg: 'md',
} as const satisfies Record<(typeof BUTTON_SIZES)[number], IconSize>
