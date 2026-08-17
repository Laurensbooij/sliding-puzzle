import '@/styles/reset.css'
import '@/styles/tokens.css'
import { I18nProvider, SUPPORTED_LOCALES } from '@i18n'
import type { Preview } from '@storybook/react-vite'

const preview: Preview = {
	parameters: {
		a11y: {
			// Fail stories on WCAG violations rather than just warning — AA is a
			// baseline requirement here, not a nice-to-have.
			test: 'error',
			config: {
				rules: [
					// axe ships target-size (SC 2.5.8) disabled by default; it is the
					// only automatable WCAG 2.2 check, so opt in.
					{ id: 'target-size', enabled: true },
				],
			},
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
