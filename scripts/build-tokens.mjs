import StyleDictionary from 'style-dictionary'

// Two source tiers (ADR-0010): tokens/figma/ is the TokensBrücke export
// (replaced wholesale, never hand-edited), tokens/manual/ holds what Figma
// cannot express. The figma tier loads via `include` so the manual tier may
// override the export's angle-less gradient approximations (material/*) with
// the render-grade CSS stacks — silently and by design.
// The export stays a manual plugin click because the Variables REST API is
// Enterprise-only (ADR-0006). Rebuild with `pnpm tokens`.

// TokensBrücke wraps each file in its collection name (`Spacing.space.3`), but
// CSS names must mirror the bare Figma variable path (`--space-3`, ADR-0010) —
// strip the wrapper before the trees merge.
StyleDictionary.registerParser({
	name: 'tokens-bruecke/strip-collection-root',
	pattern: /tokens\/figma\/.*\.json$/,
	parser: ({ contents }) => {
		const [root] = Object.values(JSON.parse(contents))
		const collections = root.$extensions['tokens-bruecke-meta'].variableCollections
		delete root.$extensions
		const refPrefix = new RegExp(`\\{(?:${collections.join('|')})\\.`, 'g')
		const stripRefPrefixes = (node) => {
			for (const [key, value] of Object.entries(node)) {
				if (typeof value === 'string') node[key] = value.replace(refPrefix, '{')
				else if (value && typeof value === 'object') stripRefPrefixes(value)
			}
		}
		stripRefPrefixes(root)
		return root
	},
})

// Figma variables are unitless numbers, so TokensBrücke types every one of
// them as a px dimension. Real units are a naming convention the build
// restores: dur/stagger are milliseconds, leading is unitless ×100, tracking
// is em ×100. Everything else converts px → rem (16px root) per the unit
// conventions — except border-width, which must not scale.
const FIGMA_UNITS_PER_GROUP = {
	dur: (value) => `${value}ms`,
	stagger: (value) => `${value}ms`,
	leading: (value) => round(value / 100),
	tracking: (value) => `${round(value / 100)}em`,
	'border-width': (value) => `${value}px`,
}
const round = (value) => Number(value.toFixed(5))
const pxToRem = (value) => `${round(value / 16)}rem`

StyleDictionary.registerTransform({
	name: 'dimension/figma-units',
	type: 'value',
	filter: (token) => (token.$type ?? token.type) === 'dimension',
	transform: (token) => {
		const raw = token.$value ?? token.value
		const value = typeof raw === 'object' ? raw.value : Number.parseFloat(raw)
		const restoreUnit = FIGMA_UNITS_PER_GROUP[token.path[0]] ?? pxToRem
		return restoreUnit(value)
	},
})

// Figma holds weights as style names ("SemiBold"), not numbers.
const WEIGHT_BY_STYLE_NAME = { Regular: 400, Medium: 500, SemiBold: 600, Bold: 700 }

StyleDictionary.registerTransform({
	name: 'fontWeight/figma-style-name',
	type: 'value',
	filter: (token) => token.path[0] === 'weight',
	transform: (token) => {
		const styleName = token.$value ?? token.value
		const weight = WEIGHT_BY_STYLE_NAME[styleName]
		if (weight === undefined) throw new Error(`Unmapped Figma weight style name: ${styleName}`)
		return weight
	},
})

// TokensBrücke reads opacity-scoped numbers as percentages and divides by 100;
// the Figma values are already fractions (0.42), so multiply back.
StyleDictionary.registerTransform({
	name: 'number/tokens-bruecke-opacity-percent',
	type: 'value',
	filter: (token) =>
		(token.$type ?? token.type) === 'number' && token.path.at(-1).endsWith('opacity'),
	transform: (token) => round((token.$value ?? token.value) * 100),
})

// Replaces the built-in typography/css/shorthand (excluded from the transform
// list below): font sizes must land in rem (unit conventions), line height as
// a unitless number rather than the export's percentage string, and Figma's
// fontStyle weight-name must not leak into the shorthand. The family stays
// unquoted so outputReferences can swap it for its var() reference.
StyleDictionary.registerTransform({
	name: 'typography/css/shorthand-rem',
	type: 'value',
	transitive: true,
	filter: (token) => (token.$type ?? token.type) === 'typography',
	transform: (token) => {
		const { fontWeight, fontSize, lineHeight, fontFamily } = token.$value ?? token.value
		// Referenced sub-values arrive already transformed: sizes carry their rem
		// unit and families their quotes (fontFamily/css).
		const size = typeof fontSize === 'object' ? pxToRem(fontSize.value) : fontSize
		const family = fontFamily.replaceAll("'", '')
		if (typeof lineHeight !== 'string' || !lineHeight.endsWith('%'))
			throw new Error(`Expected a percentage lineHeight in ${token.name}, got: ${lineHeight}`)
		const leading = round(Number.parseFloat(lineHeight) / 100)
		return `${fontWeight} ${size}/${leading} ${family}`
	},
})

const sd = new StyleDictionary({
	include: ['tokens/figma/**/*.json'],
	source: ['tokens/manual/**/*.json'],
	parsers: ['tokens-bruecke/strip-collection-root'],
	platforms: {
		css: {
			transforms: [
				...StyleDictionary.hooks.transformGroups.css.filter(
					(name) => name !== 'typography/css/shorthand',
				),
				'dimension/figma-units',
				'fontWeight/figma-style-name',
				'number/tokens-bruecke-opacity-percent',
				'typography/css/shorthand-rem',
			],
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
							'Built from tokens/figma/ + tokens/manual/ by scripts/build-tokens.mjs (`pnpm tokens`).',
							'Token values originate in Figma; see ADR-0006 and ADR-0010.',
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
