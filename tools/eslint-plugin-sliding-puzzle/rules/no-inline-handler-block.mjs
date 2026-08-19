/**
 * An `on*` JSX prop may take a reference or a one-expression arrow, never a
 * function with a body block. The block is the line: once a handler needs
 * statements — a guard, a `preventDefault`, a local — it has enough logic to
 * deserve a name, and reading the JSX should not mean reading the logic.
 *
 * Extracted handlers are named `handle*`; that half is prose, because a bare
 * `setOpen` or a forwarded `onRestart` prop is a legitimate handler value and
 * no rule can tell those from a handler that was written for the occasion.
 *
 * See docs/conventions/components.md.
 */
export default {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'require a named handler when a JSX event handler needs a body block',
		},
		messages: {
			inlineBlock:
				'Inline {{prop}} handler has a body block. Extract it to a named `handle*` function in the component and pass it by reference.',
		},
		schema: [],
	},
	create: (context) => ({
		JSXAttribute: (node) => {
			const name = node.name.type === 'JSXIdentifier' ? node.name.name : ''
			if (!/^on[A-Z]/.test(name)) return

			const { value } = node
			if (!value || value.type !== 'JSXExpressionContainer') return

			const fn = value.expression
			const isFunction =
				fn.type === 'ArrowFunctionExpression' || fn.type === 'FunctionExpression'
			if (!isFunction) return
			if (fn.body.type !== 'BlockStatement') return

			context.report({ node: fn, messageId: 'inlineBlock', data: { prop: name } })
		},
	}),
}
