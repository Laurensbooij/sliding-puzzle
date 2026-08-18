const HELPER_NAME = 'renderComponent'
const WRAPPED_NAME = 'renderWithProviders'

/**
 * Resolves the helper a call sits inside, but only when that helper is declared
 * at module top level. Ancestors start at Program, so a top-level declaration
 * puts the helper at a fixed depth — a helper nested in `describe` or `it` lands
 * deeper and is deliberately not recognised.
 */
const topLevelHelperOf = (ancestors) => {
	const [program, second, third] = ancestors
	if (program?.type !== 'Program') return undefined

	if (second?.type === 'FunctionDeclaration' && second.id?.name === HELPER_NAME) return second

	if (
		second?.type === 'VariableDeclaration' &&
		third?.type === 'VariableDeclarator' &&
		third.id.type === 'Identifier' &&
		third.id.name === HELPER_NAME
	) {
		const initialiser = third.init
		return initialiser?.type === 'ArrowFunctionExpression' ||
			initialiser?.type === 'FunctionExpression'
			? initialiser
			: undefined
	}

	return undefined
}

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
			helperTakesArguments: `${HELPER_NAME}() takes arguments — cases vary by argument rather than by declaring a helper each.`,
		},
		schema: [],
	},
	create: (context) => {
		if (!context.filename.endsWith('.spec.tsx')) return {}

		// The import may be renamed, so match the local binding rather than the
		// bare name — an alias would otherwise walk straight past this rule.
		const wrappedLocalNames = new Set()

		return {
			ImportDeclaration: (node) => {
				for (const specifier of node.specifiers) {
					if (
						specifier.type === 'ImportSpecifier' &&
						specifier.imported.type === 'Identifier' &&
						specifier.imported.name === WRAPPED_NAME
					) {
						wrappedLocalNames.add(specifier.local.name)
					}
				}
			},
			CallExpression: (node) => {
				if (node.callee.type !== 'Identifier') return
				if (!wrappedLocalNames.has(node.callee.name)) return

				const helper = topLevelHelperOf(context.sourceCode.getAncestors(node))
				if (helper === undefined) {
					context.report({ node, messageId: 'renderThroughHelper' })
					return
				}
				if (helper.params.length === 0) {
					context.report({ node: helper, messageId: 'helperTakesArguments' })
				}
			},
		}
	},
}
