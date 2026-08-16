/**
 * A component annotated `FC<T>` must name its props type exactly
 * `<ComponentName>Props`. See docs/conventions/components.md.
 */
export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'require FC type arguments to be named <ComponentName>Props',
		},
		messages: {
			wrongName: 'Props type for {{component}} must be named {{expected}}, found {{actual}}.',
		},
		schema: [],
	},
	create: (context) => ({
		VariableDeclarator: (node) => {
			if (node.id.type !== 'Identifier') return
			const annotation = node.id.typeAnnotation?.typeAnnotation
			if (
				!annotation ||
				annotation.type !== 'TSTypeReference' ||
				annotation.typeName.type !== 'Identifier' ||
				annotation.typeName.name !== 'FC'
			)
				return
			const [propsType] = annotation.typeArguments?.params ?? []
			if (!propsType || propsType.type !== 'TSTypeReference') return
			if (propsType.typeName.type !== 'Identifier') return
			const expected = `${node.id.name}Props`
			if (propsType.typeName.name === expected) return
			context.report({
				node: propsType,
				messageId: 'wrongName',
				data: {
					component: node.id.name,
					expected,
					actual: propsType.typeName.name,
				},
			})
		},
	}),
}
