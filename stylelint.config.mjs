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
		// borders, outlines, and shadow geometry. Viewport units earn their place
		// where the box must fit the screen regardless of content; `vmin` is the
		// one that holds a proportion across both orientations.
		'declaration-property-unit-allowed-list': [
			{
				'/^(margin|padding|gap|inset|top|right|bottom|left|width|height|min-width|min-height|max-width|max-height|font-size|border-radius)/':
					['rem', '%', 'vw', 'vh', 'dvh', 'vmin', 'fr'],
				'/^border(?!-radius)/': ['px'],
				'/^outline/': ['px'],
			},
			{ severity: 'error' },
		],
		'unit-disallowed-list': [],
		// Three literals that quietly bypass the design system. Durations because
		// a literal 200ms escapes the reduced-motion collapse in
		// motion-preferences.css; the other two because they fake a border that
		// takes no space — which nothing here needs any more, since Figma counts
		// its inside strokes in layout and a plain `border` already agrees with the
		// design on both sides. Matched on the value so the message can name the
		// actual mistake.
		'declaration-property-value-disallowed-list': [
			{
				'/^(transition|animation)/': ['/\\d+m?s(?![a-z-])/'],
				'outline-offset': ['/^-/', '/^calc\\(\\s*-/'],
				// `inset` followed by a length is a hand-composed shadow. Aliasing a
				// token (var(--inset-frame)) or using the clip-path shape (inset(50%))
				// never puts a number straight after the word, so both stay legal.
				'/^(--|box-shadow$)/': ['/(^|\\s)inset\\s+[-.0-9]/'],
			},
			{
				message: (property) => {
					if (property === 'outline-offset')
						return 'A negative outline-offset fakes an inside border. Use `border` — Figma counts its inside strokes in layout.'
					if (property === 'box-shadow' || property.startsWith('--'))
						return `Composing an inset shadow in ${property} fakes a border. Use \`border\` — Figma counts its inside strokes in layout, so nothing needs compensating.`
					return 'Use a motion token (var(--dur-…), var(--ease-…)) instead of a literal duration.'
				},
			},
		],
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
				'declaration-property-value-disallowed-list': null,
			},
		},
	],
}
