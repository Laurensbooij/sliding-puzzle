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
const WIDGETS_DIR = './src/widgets'

/** Directory names, read from disk so a new feature or widget needs no config edit. */
const directoryNames = (dir) =>
	existsSync(dir)
		? readdirSync(dir, { withFileTypes: true })
				.filter((entry) => entry.isDirectory())
				.map((entry) => entry.name)
		: []

const featureNames = directoryNames(FEATURES_DIR)
const widgetNames = directoryNames(WIDGETS_DIR)

// One module, one specifier: an aliased target may not also be reached through
// the long `@/...` form, or the boundary rules below have two spellings to
// match and reviewers see both. See ADR-0007.
const aliasSpellingPatterns = [
	{ group: ['@/engine', '@/engine/*'], message: 'Import the engine as `@engine`.' },
	{
		group: ['@/lib/i18n', '@/lib/i18n/*'],
		message: 'Import the i18n facade as `@i18n`, or global messages as `@messages`.',
	},
	{
		group: ['@/lib/css-utils', '@/lib/css-utils/*'],
		message: 'Import the CSS helpers as `@css-utils`.',
	},
	{ group: ['@/testing', '@/testing/*'], message: 'Import test helpers as `@testing`.' },
	{
		group: ['@/machines', '@/machines/*'],
		message: 'Import machines as `@machines/<name>`.',
	},
	{
		group: ['@/components', '@/components/*'],
		message: 'Import shared components as `@components/<Name>`.',
	},
	{
		group: ['@/widgets', '@/widgets/*'],
		message: 'Import widgets as `@widgets/<Name>`.',
	},
	// A widget's barrel is its whole public API. Its nested sub-components sit
	// beside it rather than under a `components/` segment, so without this the
	// deep path is just as importable as the barrel.
	{
		group: ['@widgets/*/*', '@widgets/*/**'],
		message:
			'Reach a widget through its barrel — `@widgets/<Name>`. What sits inside it is private.',
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

// Machines are logic, not presentation: engine + XState only. See ADR-0012.
const machinesPurityPatterns = [
	{
		group: ['react', 'react-dom', 'react-dom/*', 'react/*', '@xstate/react'],
		message:
			'Machines import nothing from React (ADR-0012) — components subscribe, machines run.',
	},
	{ group: ['*.css'], message: 'Machines have no appearance (ADR-0012).' },
]

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
		// `.claude/worktrees` holds whole checkouts of this repo — agent worktrees,
		// each with its own `.agents` fixtures. Flat-config ignore globs are
		// anchored at the config's directory, so the bare `.agents` entry only
		// covers the top-level one; without this line ESLint lints every worktree.
		ignores: [
			'dist',
			'coverage',
			'storybook-static',
			'src/styles/tokens.css',
			'.agents',
			'.claude/worktrees',
		],
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
			'sliding-puzzle/no-inline-handler-block': 'error',
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
		// Unidirectional flow: engine -> lib -> {machines | components} ->
		// widgets -> features -> app, and neither features nor widgets reach
		// sideways into one another. See ADR-0007.
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
						{ target: './src/engine', from: './src/machines' },
						{ target: './src/components', from: './src/features' },
						{ target: './src/lib', from: './src/features' },
						// lib sits *below* components in the direction, so it may not
						// reach forward into them either.
						{ target: './src/lib', from: './src/components' },
						{ target: './src/lib', from: './src/machines' },
						// Machines and components are siblings in the flow: logic and
						// presentation meet in features, never in each other (ADR-0012).
						{ target: './src/machines', from: './src/components' },
						{ target: './src/machines', from: './src/features' },
						{ target: './src/components', from: './src/machines' },
						// Widgets sit between components and features: they may not
						// reach forward, and nothing below them may reach back in.
						{ target: WIDGETS_DIR, from: './src/features' },
						{ target: WIDGETS_DIR, from: './src/machines' },
						{ target: './src/engine', from: WIDGETS_DIR },
						{ target: './src/lib', from: WIDGETS_DIR },
						{ target: './src/components', from: WIDGETS_DIR },
						// A widget owns presentation, never an actor (ADR-0012).
						{ target: './src/machines', from: WIDGETS_DIR },
						...featureNames.map((name) => ({
							target: `${FEATURES_DIR}/${name}`,
							from: FEATURES_DIR,
							except: [`./${name}`],
						})),
						// Widgets never import each other, same rule as features.
						...widgetNames.map((name) => ({
							target: `${WIDGETS_DIR}/${name}`,
							from: WIDGETS_DIR,
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
		files: ['src/machines/**/*.ts'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						...aliasSpellingPatterns,
						reactIntlPattern,
						...machinesPurityPatterns,
					],
				},
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
			'sliding-puzzle/render-through-render-component': 'error',
		},
	},
	{
		// A specced module is a unit: module + spec share a folder named after it.
		files: ['src/**/*.spec.{ts,tsx}'],
		plugins: { 'sliding-puzzle': slidingPuzzle },
		rules: {
			'sliding-puzzle/spec-in-module-folder': 'error',
		},
	},
	{
		// The spec-side half of the rendering convention: `renderComponent` is
		// only a single entry point if RTL's bare `render` cannot be reached
		// around it. src/testing/ is where the wrapper legitimately calls it.
		//
		// Flat config replaces a rule's options rather than merging them, so the
		// patterns from the src-wide block above have to be restated here or spec
		// files would silently lose their alias-spelling checks.
		files: ['src/**/*.spec.tsx'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [...aliasSpellingPatterns, reactIntlPattern],
					paths: [
						{
							name: '@testing-library/react',
							importNames: ['render'],
							message:
								"Render through the spec's renderComponent() helper, which wraps renderWithProviders from `@testing`.",
						},
					],
				},
			],
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
					'src/machines/**': 'KEBAB_CASE',
				},
			],
		},
	},
	{
		// A hook is a kebab-case module, and so is its spec — but a hook spec needs
		// a DOM, and the jsdom Vitest project is selected by the `.tsx` extension
		// (docs/conventions/testing.md). PascalCase marks a component file; this
		// is not one.
		files: ['src/**/use-*.spec.tsx'],
		plugins: { 'check-file': checkFile },
		rules: {
			'check-file/filename-naming-convention': [
				'error',
				{ 'src/**/use-*.spec.tsx': 'KEBAB_CASE' },
				{ ignoreMiddleExtensions: true },
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
