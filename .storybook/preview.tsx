import '@/styles/motion-preferences.css'
import '@/styles/reset.css'
import '@/styles/tokens.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@fontsource/ibm-plex-mono/latin-600.css'
import '@fontsource/outfit/latin-400.css'
import '@fontsource/outfit/latin-500.css'
import '@fontsource/outfit/latin-600.css'
import '@fontsource/outfit/latin-700.css'
import '@fontsource/public-sans/latin-400-italic.css'
import '@fontsource/public-sans/latin-400.css'
import '@fontsource/public-sans/latin-500.css'
import '@fontsource/public-sans/latin-600.css'
import '@fontsource/public-sans/latin-700.css'
import { I18nProvider, SUPPORTED_LOCALES } from '@i18n'
import type { Preview } from '@storybook/react-vite'

const preview: Preview = {
	parameters: {
		a11y: {
			// Fail stories on WCAG violations rather than just warning — AA is a
			// baseline requirement here, not a nice-to-have.
			test: 'error',
		},
	},
	globalTypes: {
		locale: {
			description: 'Active locale',
			toolbar: {
				icon: 'globe',
				items: SUPPORTED_LOCALES.map((locale) => ({
					value: locale,
					title: locale.toUpperCase(),
				})),
				dynamicTitle: true,
			},
		},
	},
	initialGlobals: { locale: 'en' },
	decorators: [
		// `key` remounts the provider so the toolbar reseeds the starting locale.
		(Story, context) => (
			<I18nProvider key={context.globals.locale} initialLocale={context.globals.locale}>
				<Story />
			</I18nProvider>
		),
	],
}

export default preview
