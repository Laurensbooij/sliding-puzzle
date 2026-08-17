import { existsSync } from 'node:fs'
import { basename, dirname, join, sep } from 'node:path'

/**
 * Every design-system component ships colocated Storybook stories — Storybook
 * is the visual-acceptance surface against Figma. Applies to the top-level
 * component file in the shared tier (`src/components/<Name>.tsx` or
 * `src/components/<Name>/<Name>.tsx`); private sub-components are exempt.
 * See docs/conventions/components.md.
 */
export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'require a colocated .stories.tsx for shared components',
		},
		messages: {
			missingStories:
				'{{name}} is a design-system component and must have colocated stories ({{expected}}) covering its designed variants.',
		},
		schema: [],
	},
	create: (context) => {
		const filename = context.filename
		const marker = `${sep}src${sep}components${sep}`
		const markerIndex = filename.lastIndexOf(marker)
		if (markerIndex === -1 || !filename.endsWith('.tsx')) return {}

		const name = basename(filename, '.tsx')
		if (name.endsWith('.stories') || name.endsWith('.spec')) return {}

		const relative = filename.slice(markerIndex + marker.length)
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
