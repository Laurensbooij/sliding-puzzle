import type { Preview } from '@storybook/react-vite'

import '../src/styles/reset.css'
import '../src/styles/tokens.css'

const preview: Preview = {
	parameters: {
		a11y: {
			// Fail stories on WCAG violations rather than just warning — AA is a
			// baseline requirement here, not a nice-to-have.
			test: 'error',
		},
	},
}

export default preview
