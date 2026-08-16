const QUERY_PATTERN = /^(get|query|find)(All)?By[A-Z]/

const isQueryCall = (node) =>
	node.type === 'CallExpression' &&
	((node.callee.type === 'MemberExpression' &&
		node.callee.property.type === 'Identifier' &&
		QUERY_PATTERN.test(node.callee.property.name)) ||
		(node.callee.type === 'Identifier' && QUERY_PATTERN.test(node.callee.name)))

const unwrapAwait = (node) => (node.type === 'AwaitExpression' ? node.argument : node)

/**
 * Queried elements are bound to a descriptive const before use: an inline query
 * inside expect() or a userEvent call re-runs the query on every reference and
 * hides swapped-element bugs. Enforces assignment only — descriptive naming
 * stays a review judgement. See docs/conventions/testing.md.
 */
export default {
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'require query results to be assigned to a variable before use in expect() or userEvent calls',
		},
		messages: {
			assignFirst:
				'Assign this query result to a descriptive const before {{usage}} — inline queries re-run on every reference.',
		},
		schema: [],
	},
	create: (context) => {
		const check = (callNode, usage) => {
			for (const arg of callNode.arguments) {
				const candidate = unwrapAwait(arg)
				if (isQueryCall(candidate)) {
					context.report({ node: candidate, messageId: 'assignFirst', data: { usage } })
				}
			}
		}

		return {
			CallExpression: (node) => {
				if (node.callee.type === 'Identifier' && node.callee.name === 'expect') {
					check(node, 'asserting on it')
					return
				}
				if (
					node.callee.type === 'MemberExpression' &&
					node.callee.object.type === 'Identifier' &&
					/^(user|userEvent)$/.test(node.callee.object.name)
				) {
					check(node, 'interacting with it')
				}
			},
		}
	},
}
