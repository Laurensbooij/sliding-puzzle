const HELPER_NAME = 'renderComponent'
const WRAPPED_NAME = 'renderWithProviders'

const isHelperDeclarator = (node) =>
	node.type === 'VariableDeclarator' &&
	node.id.type === 'Identifier' &&
	node.id.name === HELPER_NAME

/**
 * A component spec renders through one top-level `renderComponent` helper that
 * takes arguments, and only that helper calls `renderWithProviders`. Per-test
 * render calls drift apart: each grows its own default props, so the component's
 * baseline setup ends up restated once per case and a change to it touches every
 * test. A case the helper genuinely cannot express opts out with an
 * `eslint-disable-next-line` carrying the reason. See docs/conventions/testing.md.
 */
export default {
	meta: {
		type: 'suggestion',
		docs: {
			description: `require ${WRAPPED_NAME} to be called only from the spec's top-level ${HELPER_NAME} helper`,
		},
		messages: {
			renderThroughHelper: `Render through the spec's top-level ${HELPER_NAME}() helper — only it may call ${WRAPPED_NAME}(). Disable this line with a reason if the helper cannot express this case.`,
		},
		schema: [],
	},
	create: (context) => {
		if (!context.filename.endsWith('.spec.tsx')) return {}

		return {
			CallExpression: (node) => {
				if (node.callee.type !== 'Identifier' || node.callee.name !== WRAPPED_NAME) return

				const ancestors = context.sourceCode.getAncestors(node)
				if (ancestors.some(isHelperDeclarator)) return

				context.report({ node, messageId: 'renderThroughHelper' })
			},
		}
	},
}
