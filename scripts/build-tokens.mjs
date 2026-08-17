import StyleDictionary from 'style-dictionary'

// Placeholder values live in tokens/*.json until the Figma design system lands;
// the export stays a manual plugin click because the Variables REST API is
// Enterprise-only (ADR-0006). Rebuild with `pnpm tokens`.
const sd = new StyleDictionary({
	// Flat files are the pre-design placeholders; figma/ and manual/ are the
	// two source tiers from ADR-0010.
	source: ['tokens/*.json', 'tokens/**/*.json'],
	platforms: {
		css: {
			transformGroup: 'css',
			buildPath: 'src/styles/',
			files: [
				{
					destination: 'tokens.css',
					format: 'css/variables',
					options: {
						// Named header rather than a timestamped default: a timestamp would
						// rewrite the file on every build and churn the diff.
						fileHeader: () => [
							'GENERATED FILE — do not edit by hand.',
							'Built from tokens/*.json by scripts/build-tokens.mjs (`pnpm tokens`).',
							'Token values originate in Figma; see ADR-0006.',
						],
						// Keeps semantic tokens pointing at primitives as var() references
						// instead of flattening them to literals.
						outputReferences: true,
					},
				},
			],
		},
	},
})

await sd.buildAllPlatforms()
