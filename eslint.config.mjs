import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import checkFile from 'eslint-plugin-check-file'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import preferArrowFunctions from 'eslint-plugin-prefer-arrow-functions'
import testingLibrary from 'eslint-plugin-testing-library'
import globals from 'globals'
import tseslint from 'typescript-eslint'

import slidingPuzzle from './tools/eslint-plugin-sliding-puzzle/index.mjs'

export default tseslint.config(
	{
		ignores: ['dist', 'coverage', 'storybook-static', 'src/styles/tokens.css', '.agents'],
	},
	{
		files: ['scripts/**/*.mjs', 'tools/**/*.mjs', '*.config.mjs', '.storybook/**'],
		languageOptions: { globals: globals.node },
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ['**/*.{ts,tsx,js,jsx,mjs}'],
		plugins: {
			'prefer-arrow-functions': preferArrowFunctions,
			'sliding-puzzle': slidingPuzzle,
		},
		rules: {
			'prefer-arrow-functions/prefer-arrow-functions': 'error',
			'prefer-arrow-callback': 'error',
			'func-style': ['error', 'expression', { allowArrowFunctions: true }],
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
			],
			'sliding-puzzle/no-inline-testid': 'error',
			'sliding-puzzle/testids-in-constants-file': 'error',
			'sliding-puzzle/props-type-naming': 'error',
		},
	},
	{
		files: ['src/**/*.{tsx,jsx}'],
		...jsxA11y.flatConfigs.recommended,
	},
	{
		// The engine is pure: no React, no DOM, no styling. See ADR-0001.
		files: ['src/engine/**/*.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: [
								'react',
								'react-dom',
								'react-dom/*',
								'react/*',
								'xstate',
								'@xstate/*',
							],
							message: 'The engine imports nothing from React or XState (ADR-0001).',
						},
						{
							group: ['*.css'],
							message: 'The engine has no appearance (ADR-0001).',
						},
					],
				},
			],
		},
	},
	{
		files: ['src/**/*.spec.{ts,tsx}'],
		...testingLibrary.configs['flat/react'],
	},
	{
		files: ['src/**/*.spec.{ts,tsx}', 'tools/**/*.spec.mjs'],
		plugins: { 'sliding-puzzle': slidingPuzzle },
		rules: {
			'sliding-puzzle/assign-before-assert': 'error',
		},
	},
	{
		// Component files are PascalCase; every other source file is kebab-case.
		// (CSS naming can't be lint-checked here — ESLint doesn't parse CSS; the
		// satellite-naming convention covers it in docs/conventions/components.md.)
		files: ['src/**/*.{ts,tsx,js,jsx}'],
		plugins: { 'check-file': checkFile },
		rules: {
			'check-file/filename-naming-convention': [
				'error',
				{
					'src/**/!(main|vite-env)*.{tsx,jsx}': 'PASCAL_CASE',
					'src/**/*.ts': 'KEBAB_CASE',
				},
				{ ignoreMiddleExtensions: true },
			],
			'check-file/folder-naming-convention': [
				'error',
				{
					'src/components/**': 'PASCAL_CASE',
					'src/engine/**': 'KEBAB_CASE',
					'src/features/**': 'KEBAB_CASE',
				},
			],
		},
	},
	prettier,
)
