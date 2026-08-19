import type { IconName } from '@components/Icon'

export const DIALOG_TESTIDS = {
	BASE: 'dialog',
	BADGE_SUFFIX: '-badge',
	CLOSE_SUFFIX: '-close',
} as const

/** Kinds of the Figma component set, in the order its grid lists them. */
export const DIALOG_KINDS = ['win', 'confirm'] as const

/**
 * The glyph each kind wears, taken from the badge instance in Figma. The card
 * owns this rather than accepting an icon: the kind is what the design varies,
 * and a caller free to pair the confirm tone with the party popper would be
 * free to draw a dialog the design system does not have.
 */
export const DIALOG_KIND_GLYPHS = {
	win: 'party-popper',
	confirm: 'info',
} as const satisfies Record<(typeof DIALOG_KINDS)[number], IconName>
