/**
 * Enforces the CSS conventions from docs/conventions/styling.md:
 * design tokens for every design value, rem-by-default units, no !important.
 */
export default {
	extends: ['stylelint-config-standard'],
	plugins: ['stylelint-declaration-strict-value'],
	// Generated file (ADR-0006) — not subject to authoring conventions.
	ignoreFiles: ['src/styles/tokens.css'],
	rules: {
		'declaration-no-important': true,
		// Design values must come from tokens.css custom properties.
		'scale-unlimited/declaration-strict-value': [
			[
				'/color$/',
				'background-color',
				'fill',
				'stroke',
				'font-family',
				'font-size',
				'font-weight',
				'border-radius',
				'box-shadow',
			],
			{
				ignoreValues: ['currentColor', 'transparent', 'inherit', 'none', '0'],
				message:
					'Use a design token (var(--…)) instead of a literal — add a token if missing.',
			},
		],
		// rem scales with user font size; px only where scaling would be wrong:
		// borders, outlines, and shadow geometry.
		'declaration-property-unit-allowed-list': [
			{
				'/^(margin|padding|gap|inset|top|right|bottom|left|width|height|min-width|min-height|max-width|max-height|font-size|border-radius)/':
					['rem', '%', 'vw', 'vh', 'dvh', 'fr'],
				'/^border(?!-radius)/': ['px'],
				'/^outline/': ['px'],
			},
			{ severity: 'error' },
		],
		'unit-disallowed-list': [],
		// CSS Modules camelCase class names, so styles.iconWrapper dot-access works.
		'selector-class-pattern': [
			'^[a-z][a-zA-Z0-9]*$',
			{ message: 'Use camelCase class names (styles.iconWrapper).' },
		],
	},
	overrides: [
		{
			// The global reset predates tokens and legitimately uses !important
			// inside the prefers-reduced-motion guard.
			files: ['src/styles/reset.css'],
			rules: {
				'declaration-no-important': null,
				'scale-unlimited/declaration-strict-value': null,
				'property-no-vendor-prefix': null,
			},
		},
	],
}
