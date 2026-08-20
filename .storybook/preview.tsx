import '@/styles/fonts'
import '@/styles/motion-preferences.css'
import '@/styles/reset.css'
import '@/styles/tokens.css'
import { I18nProvider, SUPPORTED_LOCALES } from '@i18n'
import type { Preview } from '@storybook/react-vite'

const preview: Preview = {
	parameters: {
		// Baseline for storybook-addon-pseudo-states. The addon only clears a
		// forced state when the story it moves to declares one, so a story with
		// no `pseudo` parameter at all inherits whatever was forced last — a
		// hovered segment stays hovered as you click down the sidebar. Declaring
		// every state empty here means each story always carries a full,
		// definitive instruction and stories override only the keys they need.
		pseudo: {
			hover: [],
			active: [],
			focusVisible: [],
			focusWithin: [],
			focus: [],
			visited: [],
			link: [],
			target: [],
		},
		a11y: {
			// Fail stories on WCAG violations rather than just warning — AA is a
			// baseline requirement here, not a nice-to-have.
			test: 'error',
			config: {
				rules: [
					// Off by default in axe — opt in per docs/conventions/accessibility.md.
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
		// Controlled, so the toolbar drives it directly — no remount needed.
		// Stories that also mount `SettingsProvider` seed the same global into
		// storage, so the picker and the copy never disagree on screen.
		(Story, context) => (
			<I18nProvider locale={context.globals.locale}>
				<Story />
			</I18nProvider>
		),
	],
}

export default preview
