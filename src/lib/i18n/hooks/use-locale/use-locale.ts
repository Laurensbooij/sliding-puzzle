import { useContext } from 'react'

import { LocaleContext, type LocaleContextValue } from '../../I18nProvider'

/** Reads and changes the active locale. Throws outside `<I18nProvider>`. */
export const useLocale = (): LocaleContextValue => {
	const context = useContext(LocaleContext)
	if (!context) throw new Error('useLocale must be used inside <I18nProvider>')
	return context
}
