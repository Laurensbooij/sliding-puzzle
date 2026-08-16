/**
 * A component's props type is its signature, so it lives in the component file
 * itself — directly above the component — not in a sibling `types.ts`.
 * Component files are `.tsx`, so anything named `*Props` declared in a `.ts`
 * file is in the wrong place. See docs/conventions/components.md.
 */
export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'require *Props types to be declared in the component file',
		},
		messages: {
			wrongFile:
				'{{name}} must be declared in the component file, directly above the component — not in a separate .ts file.',
		},
		schema: [],
	},
	create: (context) => {
		if (context.filename.endsWith('.tsx')) return {}

		const report = (node) => {
			if (node.id.type !== 'Identifier' || !/Props$/.test(node.id.name)) return
			context.report({
				node: node.id,
				messageId: 'wrongFile',
				data: { name: node.id.name },
			})
		}

		return {
			TSInterfaceDeclaration: report,
			TSTypeAliasDeclaration: report,
		}
	},
}
