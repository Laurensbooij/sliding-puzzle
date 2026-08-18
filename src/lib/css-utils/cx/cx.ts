/** A class name, or a condition that produced none. */
type ClassName = string | false | null | undefined

/**
 * Joins CSS-module class names, dropping the ones a condition ruled out.
 *
 * Returns `undefined` rather than `''` when nothing survives, so React omits the
 * attribute instead of rendering a bare `class=""`.
 */
export const cx = (...classNames: readonly ClassName[]): string | undefined =>
	classNames.filter(Boolean).join(' ') || undefined
