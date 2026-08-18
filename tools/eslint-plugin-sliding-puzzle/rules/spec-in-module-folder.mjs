import { basename, dirname } from 'node:path'

/**
 * A module with a spec lives in a folder named after it: the pair is one unit,
 * and the folder is what keeps it one as satellites accumulate. Reported on
 * the spec because the spec is what marks a module as folder-worthy.
 * See docs/conventions/testing.md.
 */
export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'require a spec (and thus its module) to live in a folder named after it',
		},
		messages: {
			wrongFolder:
				'{{spec}} and its module belong in a folder named `{{name}}/`, not `{{folder}}/`.',
		},
		schema: [],
	},
	create: (context) => {
		const filename = context.filename
		const match = /([^/\\]+)\.spec\.(ts|tsx|mjs)$/.exec(filename)
		if (!match) return {}

		const name = match[1]
		const folder = basename(dirname(filename))
		if (folder === name) return {}

		return {
			Program: (node) => {
				context.report({
					node,
					messageId: 'wrongFolder',
					data: { spec: basename(filename), name, folder },
				})
			},
		}
	},
}
