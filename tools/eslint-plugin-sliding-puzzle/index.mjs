import assignBeforeAssert from './rules/assign-before-assert.mjs'
import noInlineTestid from './rules/no-inline-testid.mjs'
import propsTypeInComponentFile from './rules/props-type-in-component-file.mjs'
import propsTypeNaming from './rules/props-type-naming.mjs'
import storiesFileRequired from './rules/stories-file-required.mjs'
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
		'props-type-in-component-file': propsTypeInComponentFile,
		'assign-before-assert': assignBeforeAssert,
		'stories-file-required': storiesFileRequired,
	},
}
