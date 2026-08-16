import path from 'node:path'

/**
 * *_TESTIDS objects live in the component's local constants.ts — never in a
 * separate .testids file or inside the component itself.
 * See docs/conventions/components.md.
 */
export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'require *_TESTIDS constants to be declared in constants.ts',
		},
		messages: {
			wrongFile:
				'{{name}} must be declared in the component’s constants.ts, not in {{basename}}.',
		},
		schema: [],
	},
	create: (context) => ({
		VariableDeclarator: (node) => {
			if (node.id.type !== 'Identifier' || !/_TESTIDS$/.test(node.id.name)) return
			const basename = path.basename(context.filename)
			if (basename === 'constants.ts') return
			context.report({
				node: node.id,
				messageId: 'wrongFile',
				data: { name: node.id.name, basename },
			})
		},
	}),
}
