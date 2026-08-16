/**
 * data-testid values must come from a *_TESTIDS constant, never a string literal.
 * See docs/conventions/components.md and ADR-0005.
 */
export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'disallow string literals in data-testid; use a *_TESTIDS constant',
		},
		messages: {
			inlineTestid:
				'Inline data-testid string. Reference the component’s *_TESTIDS constant from constants.ts instead.',
		},
		schema: [],
	},
	create: (context) => {
		const isLiteralOnlyTemplate = (node) =>
			node.type === 'TemplateLiteral' && node.expressions.length === 0

		return {
			JSXAttribute: (node) => {
				if (node.name.name !== 'data-testid') return
				const { value } = node
				if (!value) return
				if (value.type === 'Literal' && typeof value.value === 'string') {
					context.report({ node: value, messageId: 'inlineTestid' })
					return
				}
				if (value.type === 'JSXExpressionContainer') {
					const inner = value.expression
					if (
						(inner.type === 'Literal' && typeof inner.value === 'string') ||
						isLiteralOnlyTemplate(inner)
					) {
						context.report({ node: inner, messageId: 'inlineTestid' })
					}
				}
			},
		}
	},
}
