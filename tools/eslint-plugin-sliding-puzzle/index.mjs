import assignBeforeAssert from './rules/assign-before-assert.mjs'
import noInlineTestid from './rules/no-inline-testid.mjs'
import propsTypeNaming from './rules/props-type-naming.mjs'
import testidsInConstantsFile from './rules/testids-in-constants-file.mjs'

export default {
	meta: {
		name: 'eslint-plugin-sliding-puzzle',
		version: '0.0.0',
	},
	rules: {
		'no-inline-testid': noInlineTestid,
		'testids-in-constants-file': testidsInConstantsFile,
		'props-type-naming': propsTypeNaming,
		'assign-before-assert': assignBeforeAssert,
	},
}
