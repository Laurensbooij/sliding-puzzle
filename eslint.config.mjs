import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import checkFile from 'eslint-plugin-check-file'
import formatjs from 'eslint-plugin-formatjs'
import importX from 'eslint-plugin-import-x'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import preferArrowFunctions from 'eslint-plugin-prefer-arrow-functions'
import testingLibrary from 'eslint-plugin-testing-library'
import globals from 'globals'
import { existsSync, readdirSync } from 'node:fs'
import tseslint from 'typescript-eslint'

import slidingPuzzle from './tools/eslint-plugin-sliding-puzzle/index.mjs'

const FEATURES_DIR = './src/features'

/** Feature folder names, read from disk so a new feature needs no config edit. */
const featureNames = existsSync(FEATURES_DIR)
	? readdirSync(FEATURES_DIR, { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name)
	: []

// One module, one specifier: an aliased target may not also be reached through
// the long `@/...` form, or the boundary rules below have two spellings to
// match and reviewers see both. See ADR-0007.
const aliasSpellingPatterns = [
	{ group: ['@/engine', '@/engine/*'], message: 'Import the engine as `@engine`.' },
	{
		group: ['@/lib/i18n', '@/lib/i18n/*'],
		message: 'Import the i18n facade as `@i18n`, or global messages as `@messages`.',
	},
	{ group: ['@/testing', '@/testing/*'], message: 'Import test helpers as `@testing`.' },
	{
		group: ['@/components', '@/components/*'],
		message: 'Import shared components as `@components/<Name>`.',
	},
	{
		group: ['@/source-images/vectors/*', '**/source-images/vectors/*'],
		message:
			'Reach source images through the registry — `@/source-images`. A hard-coded path skips the SourceImageName type.',
	},
]

// react-intl is wrapped by the facade so consumers depend on our surface, not
// the library's. See ADR-0008.
const reactIntlPattern = {
	group: ['react-intl'],
	message: 'Import from `@i18n` — react-intl is only imported inside src/lib/i18n.',
}

// The engine is pure: no React, no XState, no styling. See ADR-0001.
const enginePurityPatterns = [
	{
		group: ['react', 'react-dom', 'react-dom/*', 'react/*', 'xstate', '@xstate/*'],
		message: 'The engine imports nothing from React or XState (ADR-0001).',
	},
	{ group: ['*.css'], message: 'The engine has no appearance (ADR-0001).' },
]

export default tseslint.config(
	{
		ignores: ['dist', 'coverage', 'storybook-static', 'src/styles/tokens.css', '.agents'],
	},
	{
		files: [
			'scripts/**/*.mjs',
			'tools/**/*.mjs',
			'.claude/**/*.mjs',
			'*.config.mjs',
			'.storybook/**',
		],
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
			'sliding-puzzle/props-type-in-component-file': 'error',
			'sliding-puzzle/stories-file-required': 'error',
		},
	},
	{
		files: ['src/**/*.{ts,tsx}'],
		rules: {
			'no-restricted-imports': [
				'error',
				{ patterns: [...aliasSpellingPatterns, reactIntlPattern] },
			],
		},
	},
	{
		// Config outside src/ (Storybook) reaches app modules too, and a relative
		// escape like `../src/lib/i18n` matches none of the `@/...` patterns — so
		// the aliased spellings have to be required from this side as well.
		files: ['.storybook/**/*.{ts,tsx}'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						...aliasSpellingPatterns,
						reactIntlPattern,
						{
							group: ['../src/*', '../src/**'],
							message:
								'Reach app modules by alias — `@i18n`, `@engine`, `@messages`, or `@/*`.',
						},
					],
				},
			],
		},
	},
	{
		// Unidirectional flow: engine -> lib -> features -> app, and features
		// never reach sideways into one another. See ADR-0007.
		files: ['src/**/*.{ts,tsx}'],
		plugins: { 'import-x': importX },
		// Without a TypeScript resolver the rule cannot turn an extensionless or
		// aliased specifier into a file path, and silently matches nothing.
		settings: {
			'import-x/resolver-next': [
				createTypeScriptImportResolver({ project: './tsconfig.app.json' }),
			],
		},
		rules: {
			'import-x/no-restricted-paths': [
				'error',
				{
					zones: [
						{ target: './src/engine', from: './src/features' },
						{ target: './src/engine', from: './src/components' },
						{ target: './src/engine', from: './src/lib' },
						{ target: './src/engine', from: './src/testing' },
						{ target: './src/components', from: './src/features' },
						{ target: './src/lib', from: './src/features' },
						// lib sits *below* components in the direction, so it may not
						// reach forward into them either.
						{ target: './src/lib', from: './src/components' },
						...featureNames.map((name) => ({
							target: `${FEATURES_DIR}/${name}`,
							from: FEATURES_DIR,
							except: [`./${name}`],
						})),
					],
				},
			],
		},
	},
	{
		files: ['src/**/*.{tsx,jsx}'],
		...jsxA11y.flatConfigs.recommended,
	},
	{
		// User-facing copy goes through the i18n facade, never a bare literal.
		files: ['src/**/*.tsx'],
		ignores: ['src/**/*.spec.tsx', 'src/**/*.stories.tsx'],
		plugins: { formatjs },
		rules: {
			'formatjs/no-literal-string-in-jsx': 'error',
		},
	},
	{
		files: ['src/engine/**/*.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [...aliasSpellingPatterns, reactIntlPattern, ...enginePurityPatterns],
				},
			],
		},
	},
	{
		// The registry is the one module that may reach the vector files — that
		// is what makes it the boundary the type union rests on.
		files: ['src/source-images/index.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{ patterns: [...aliasSpellingPatterns, reactIntlPattern] },
			],
		},
	},
	{
		// The one place react-intl may be imported — that is what makes the
		// facade a boundary rather than a suggestion.
		files: ['src/lib/i18n/**/*.{ts,tsx}'],
		rules: {
			'no-restricted-imports': ['error', { patterns: aliasSpellingPatterns }],
		},
	},
	{
		files: ['src/**/*.spec.{ts,tsx}'],
		...testingLibrary.configs['flat/react'],
	},
	{
		files: ['src/**/*.spec.{ts,tsx}', 'tools/**/*.spec.mjs', '.claude/**/*.spec.mjs'],
		plugins: { 'sliding-puzzle': slidingPuzzle },
		rules: {
			'sliding-puzzle/assign-before-assert': 'error',
		},
	},
	{
		// Component files are PascalCase; every other source file is kebab-case.
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
					// A features path mixes kebab-case feature folders with PascalCase
					// component folders, and this rule validates every segment it
					// traverses, so no single pattern expresses both. Component folder
					// casing there rests on the PascalCase filename rule.
					'src/components/**': 'PASCAL_CASE',
					'src/engine/**': 'KEBAB_CASE',
				},
			],
		},
	},
	{
		// PascalCase marks a component file. Helpers that merely happen to contain
		// JSX — test renderers, decorators — stay kebab-case like any other module.
		files: ['src/testing/**/*.{ts,tsx}'],
		plugins: { 'check-file': checkFile },
		rules: {
			'check-file/filename-naming-convention': [
				'error',
				{ 'src/testing/**/*.{ts,tsx}': 'KEBAB_CASE' },
				{ ignoreMiddleExtensions: true },
			],
		},
	},
	prettier,
)
