import StyleDictionary from 'style-dictionary'

// Placeholder values live in tokens/*.json until the Figma design system lands;
// the export stays a manual plugin click because the Variables REST API is
// Enterprise-only (ADR-0006). Rebuild with `pnpm tokens`.
const HEADER = [
	'/**',
	' * GENERATED FILE — do not edit by hand.',
	' * Built from tokens/*.json by scripts/build-tokens.mjs (`pnpm tokens`).',
	' * Token values originate in Figma; see ADR-0006.',
	' */',
].join('\n')

const sd = new StyleDictionary({
	source: ['tokens/*.json'],
	platforms: {
		css: {
			transformGroup: 'css',
			buildPath: 'src/styles/',
			files: [
				{
					destination: 'tokens.css',
					format: 'css/variables',
					options: { fileHeader: () => [], outputReferences: true },
				},
			],
		},
	},
})

await sd.buildAllPlatforms()

const { readFile, writeFile } = await import('node:fs/promises')
const path = 'src/styles/tokens.css'
const generated = await readFile(path, 'utf8')
const withoutDefaultHeader = generated.replace(/^\/\*\*[\s\S]*?\*\/\n*/, '')
await writeFile(path, `${HEADER}\n\n${withoutDefaultHeader}`)
console.log(`wrote ${path}`)
