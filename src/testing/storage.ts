/** Seeds localStorage and hands back what was written, ready to assert against later. */
export const seedStorage = (entries: Record<string, string>): Record<string, string> => {
	for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
	return entries
}

/**
 * Reads keys back raw. Compared against a `seedStorage` result, this is what
 * makes per-key isolation falsifiable: a neighbour that was rewritten, cleared
 * or re-serialised no longer matches the exact string that went in.
 */
export const readStorage = (keys: string[]): Record<string, string | null> =>
	Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)]))
