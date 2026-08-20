import '@/styles/fonts'
import '@/styles/motion-preferences.css'
import '@/styles/reset.css'
import '@/styles/tokens.css'
import { GameConfigProvider } from '@game-config'
import { RecordsProvider } from '@records'
import { SettingsProvider } from '@settings'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router'

import { LocaleProvider } from './LocaleProvider'
import { routes } from './routes/routes'

const router = createBrowserRouter(routes)

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root is missing from index.html')

// Providers sit outside the router: locale and persisted state belong to the
// session, not to a route, and remounting them on every navigation would drop
// state the screens share.
//
// Settings is outermost of the pair it forms with i18n, because it now owns the
// locale: `LocaleProvider` reads the setting and hands it to `I18nProvider`.
createRoot(rootElement).render(
	<StrictMode>
		<GameConfigProvider>
			<SettingsProvider>
				<LocaleProvider>
					<RecordsProvider>
						<RouterProvider router={router} />
					</RecordsProvider>
				</LocaleProvider>
			</SettingsProvider>
		</GameConfigProvider>
	</StrictMode>,
)
