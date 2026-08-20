import { Message, createTranslate } from '@i18n'
import { globalMessages } from '@messages'
import { SETTINGS_STORAGE_KEY } from '@settings'
import type { Settings } from '@settings'
import { renderWithProviders, seedStorage } from '@testing'
import { screen } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LocalizedApp } from './LocalizedApp'

const DUTCH_SETTINGS: Settings = {
	referenceImage: true,
	numberedTiles: false,
	showTimer: true,
	locale: 'nl',
}

/**
 * The harness mounts an `I18nProvider` of its own, so the one under test is
 * nested inside it — which is the point: whichever locale the harness asks for,
 * the stored setting is what the subtree ends up rendering in.
 */
const renderComponent = (stored?: Settings): RenderResult => {
	if (stored) seedStorage({ [SETTINGS_STORAGE_KEY]: JSON.stringify(stored) })

	return renderWithProviders(
		<LocalizedApp>
			<Message message={globalMessages.appName} />
		</LocalizedApp>,
		{ providers: { settings: true } },
	)
}

describe('LocalizedApp', () => {
	it('renders the app in the language the player stored', () => {
		const { translate: translateDutch } = createTranslate('nl')
		renderComponent(DUTCH_SETTINGS)

		const name = screen.getByText(translateDutch(globalMessages.appName))
		expect(name).toBeVisible()
	})

	// `index.html` ships `lang="en"`. Without this the page keeps claiming
	// English while showing Dutch, and a screen reader reads it with English
	// phonemes (WCAG 3.1.1).
	it('tells the page which language it is in', () => {
		renderComponent(DUTCH_SETTINGS)

		expect(document.documentElement).toHaveAttribute('lang', 'nl')
	})

	it('falls back to the detected language when nothing is stored', () => {
		renderComponent()

		expect(document.documentElement).toHaveAttribute('lang', 'en')
	})
})
