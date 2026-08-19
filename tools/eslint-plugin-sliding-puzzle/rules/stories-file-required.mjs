import { existsSync } from 'node:fs'
import { basename, dirname, join, sep } from 'node:path'

/**
 * Every component in a shared tier ships colocated Storybook stories —
 * Storybook is the visual-acceptance surface against Figma. Applies to the
 * top-level component file in `src/components/` (product-agnostic) and
 * `src/widgets/` (Sliding Puzzle-specific), flat or in its own folder; nested
 * sub-components are exempt. See docs/conventions/components.md.
 */
const TIER_MARKERS = [`${sep}src${sep}components${sep}`, `${sep}src${sep}widgets${sep}`]

const tierRelativePath = (filename) => {
	for (const marker of TIER_MARKERS) {
		const markerIndex = filename.lastIndexOf(marker)
		if (markerIndex !== -1) return filename.slice(markerIndex + marker.length)
	}
	return null
}

export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'require a colocated .stories.tsx for shared and widget components',
		},
		messages: {
			missingStories:
				'{{name}} lives in a shared tier and must have colocated stories ({{expected}}) covering its designed variants.',
		},
		schema: [],
	},
	create: (context) => {
		const filename = context.filename
		if (!filename.endsWith('.tsx')) return {}

		const relative = tierRelativePath(filename)
		if (relative === null) return {}

		const name = basename(filename, '.tsx')
		if (name.endsWith('.stories') || name.endsWith('.spec')) return {}

		const segments = relative.split(sep)
		const isFlat = segments.length === 1
		const isFolder = segments.length === 2 && segments[0] === name
		if (!isFlat && !isFolder) return {}

		const expected = `${name}.stories.tsx`
		if (existsSync(join(dirname(filename), expected))) return {}

		return {
			Program: (node) => {
				context.report({ node, messageId: 'missingStories', data: { name, expected } })
			},
		}
	},
}
