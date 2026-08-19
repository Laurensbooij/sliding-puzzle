import { GameConfigProvider } from '@/lib/game-config'
import { RecordsProvider } from '@/lib/records'
import { SettingsProvider } from '@/lib/settings'
import '@/styles/fonts'
import '@/styles/motion-preferences.css'
import '@/styles/reset.css'
import '@/styles/tokens.css'
import { I18nProvider } from '@i18n'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router'

import { routes } from './routes/routes'

const router = createBrowserRouter(routes)

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root is missing from index.html')

// Providers sit outside the router: locale and persisted state belong to the
// session, not to a route, and remounting them on every navigation would drop
// state the screens share.
createRoot(rootElement).render(
	<StrictMode>
		<I18nProvider>
			<GameConfigProvider>
				<SettingsProvider>
					<RecordsProvider>
						<RouterProvider router={router} />
					</RecordsProvider>
				</SettingsProvider>
			</GameConfigProvider>
		</I18nProvider>
	</StrictMode>,
)
