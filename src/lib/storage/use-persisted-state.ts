import { type Dispatch, type SetStateAction, useCallback, useState } from 'react'

/**
 * Narrows a parsed payload to the shape a key is supposed to hold. Hand-rolled
 * per module rather than derived from a schema library: three small shapes do
 * not pay for a runtime dependency.
 */
export type PersistedGuard<T> = (value: unknown) => value is T

/**
 * Anything a key cannot be trusted to hold — absent, unparseable, or the wrong
 * shape after a hand-edit or a rolled-back release — resolves to the fallback,
 * silently. A player who broke their storage gets defaults, never a crash.
 */
const readPersisted = <T>(key: string, isValid: PersistedGuard<T>, fallback: T): T => {
	try {
		const stored = globalThis.localStorage?.getItem(key)
		if (stored === null || stored === undefined) return fallback

		const parsed: unknown = JSON.parse(stored)
		return isValid(parsed) ? parsed : fallback
	} catch {
		return fallback
	}
}

const writePersisted = (key: string, value: unknown): void => {
	try {
		globalThis.localStorage?.setItem(key, JSON.stringify(value))
	} catch {
		// Storage can be full, disabled, or blocked in private mode. Losing the
		// write costs a preference; throwing here would cost the game.
	}
}

/**
 * State that survives a reload, read from and written to one localStorage key.
 *
 * The key carries its own version (`sliding-puzzle.<name>.v1`), so a shape
 * change is a new key rather than an in-place upgrade: the new version starts
 * from defaults and a migration, if one is ever worth writing, reads the old
 * key. Keys are independent — a corrupt one can only ever cost its own module
 * its stored value.
 */
export const usePersistedState = <T>(
	key: string,
	isValid: PersistedGuard<T>,
	fallback: T,
): [T, Dispatch<SetStateAction<T>>] => {
	const [value, setValue] = useState<T>(() => readPersisted(key, isValid, fallback))

	const setPersistedValue = useCallback<Dispatch<SetStateAction<T>>>(
		(update) => {
			// Writing from inside the updater is what keeps the stored value tied to
			// the state React actually committed, rather than to a value captured in
			// a stale closure. The write is idempotent, so StrictMode's double
			// invocation is harmless.
			setValue((previous) => {
				const next =
					typeof update === 'function' ? (update as (previous: T) => T)(previous) : update
				writePersisted(key, next)
				return next
			})
		},
		[key],
	)

	return [value, setPersistedValue]
}
