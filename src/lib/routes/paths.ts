/**
 * Every path the app can be at, declared once.
 *
 * The router maps these to screens and the screens link between them, so a
 * path is spelled in exactly one place. No alias: two call sites do not clear
 * ADR-0007's bar for minting one.
 */
export const ROUTES = {
	setup: '/',
	play: '/play',
} as const
