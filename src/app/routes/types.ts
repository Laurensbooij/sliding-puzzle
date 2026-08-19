import type { TranslationMessage } from '@i18n'

/**
 * What a route tells the shell about itself. React Router types `handle` as
 * `unknown`, so this is the shape the shell narrows to before reading it.
 */
export interface RouteHandle {
	/** The document title while this route is matched. */
	title: TranslationMessage
}
