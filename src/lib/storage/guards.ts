/**
 * Every persisted payload is a JSON object; each module's own guard narrows
 * from here. Arrays are excluded — none of the stored shapes is one, and
 * `typeof [] === 'object'` would otherwise let one through.
 */
export const isJsonObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)
