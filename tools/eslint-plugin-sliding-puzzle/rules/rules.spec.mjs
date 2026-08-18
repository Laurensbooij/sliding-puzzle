import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'
import { afterAll, describe, it } from 'vitest'

import assignBeforeAssert from './assign-before-assert.mjs'
import noInlineTestid from './no-inline-testid.mjs'
import propsTypeInComponentFile from './props-type-in-component-file.mjs'
import propsTypeNaming from './props-type-naming.mjs'
import renderThroughRenderComponent from './render-through-render-component.mjs'
import specInModuleFolder from './spec-in-module-folder.mjs'
import storiesFileRequired from './stories-file-required.mjs'
import testidsInConstantsFile from './testids-in-constants-file.mjs'

const FIXTURES = new URL('../fixtures/', import.meta.url).pathname

RuleTester.afterAll = afterAll
RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({
	languageOptions: {
		parser: tseslint.parser,
		ecmaVersion: 'latest',
		sourceType: 'module',
		parserOptions: { ecmaFeatures: { jsx: true } },
	},
})

ruleTester.run('no-inline-testid', noInlineTestid, {
	valid: [
		{ code: '<div data-testid={TILE_TESTIDS.BASE} />', filename: 'Tile.tsx' },
		{
			code: '<div data-testid={`${TILE_TESTIDS.BASE}${TILE_TESTIDS.LABEL_SUFFIX}`} />',
			filename: 'Tile.tsx',
		},
		{ code: '<div data-testid={dataTestId ?? TILE_TESTIDS.BASE} />', filename: 'Tile.tsx' },
	],
	invalid: [
		{
			code: '<div data-testid="tile" />',
			filename: 'Tile.tsx',
			errors: [{ messageId: 'inlineTestid' }],
		},
		{
			code: '<div data-testid={"tile"} />',
			filename: 'Tile.tsx',
			errors: [{ messageId: 'inlineTestid' }],
		},
		{
			code: '<div data-testid={`tile`} />',
			filename: 'Tile.tsx',
			errors: [{ messageId: 'inlineTestid' }],
		},
	],
})

ruleTester.run('testids-in-constants-file', testidsInConstantsFile, {
	valid: [
		{
			code: 'export const TILE_TESTIDS = { BASE: "tile" }',
			filename: '/src/components/Tile/constants.ts',
		},
		{ code: 'export const MAX_RETRIES = 3', filename: '/src/components/Tile/Tile.tsx' },
	],
	invalid: [
		{
			code: 'export const TILE_TESTIDS = { BASE: "tile" }',
			filename: '/src/components/Tile/Tile.tsx',
			errors: [{ messageId: 'wrongFile' }],
		},
		{
			code: 'export const TILE_TESTIDS = { BASE: "tile" }',
			filename: '/src/components/Tile/tile.testids.ts',
			errors: [{ messageId: 'wrongFile' }],
		},
	],
})

ruleTester.run('props-type-naming', propsTypeNaming, {
	valid: [
		{ code: 'export const Tile: FC<TileProps> = (props) => null', filename: 'Tile.tsx' },
		{ code: 'export const App: FC = () => null', filename: 'App.tsx' },
	],
	invalid: [
		{
			code: 'export const Tile: FC<TileProperties> = (props) => null',
			filename: 'Tile.tsx',
			errors: [{ messageId: 'wrongName' }],
		},
		{
			code: 'export const Tile: FC<BoardProps> = (props) => null',
			filename: 'Tile.tsx',
			errors: [{ messageId: 'wrongName' }],
		},
	],
})

ruleTester.run('props-type-in-component-file', propsTypeInComponentFile, {
	valid: [
		{
			code: 'export interface TileProps { tile: number }',
			filename: '/src/components/Tile/Tile.tsx',
		},
		{
			code: 'export type TileProps = { tile: number }',
			filename: '/src/components/Tile/Tile.tsx',
		},
		{
			// Non-props types are exactly what types.ts is still for.
			code: 'export interface BoardView { cells: number[] }',
			filename: '/src/components/Board/types.ts',
		},
	],
	invalid: [
		{
			code: 'export interface TileProps { tile: number }',
			filename: '/src/components/Tile/types.ts',
			errors: [{ messageId: 'wrongFile' }],
		},
		{
			code: 'export type TileProps = { tile: number }',
			filename: '/src/components/Tile/types.ts',
			errors: [{ messageId: 'wrongFile' }],
		},
		{
			code: 'export interface TileProps { tile: number }',
			filename: '/src/components/Tile/constants.ts',
			errors: [{ messageId: 'wrongFile' }],
		},
	],
})

ruleTester.run('assign-before-assert', assignBeforeAssert, {
	valid: [
		{
			code: 'const tile = screen.getByRole("button"); expect(tile).toBeVisible()',
			filename: 'Tile.spec.tsx',
		},
		{
			code: 'const tile = screen.getByRole("button"); await user.click(tile)',
			filename: 'Tile.spec.tsx',
		},
		{
			code: 'const tile = await screen.findByRole("button"); expect(tile).toBeVisible()',
			filename: 'Tile.spec.tsx',
		},
	],
	invalid: [
		{
			code: 'expect(screen.getByRole("button")).toBeVisible()',
			filename: 'Tile.spec.tsx',
			errors: [{ messageId: 'assignFirst' }],
		},
		{
			code: 'expect(await screen.findByRole("button")).toBeVisible()',
			filename: 'Tile.spec.tsx',
			errors: [{ messageId: 'assignFirst' }],
		},
		{
			code: 'await user.click(screen.getByTestId("tile"))',
			filename: 'Tile.spec.tsx',
			errors: [{ messageId: 'assignFirst' }],
		},
		{
			code: 'await userEvent.click(within(board).getByRole("button"))',
			filename: 'Tile.spec.tsx',
			errors: [{ messageId: 'assignFirst' }],
		},
	],
})

ruleTester.run('stories-file-required', storiesFileRequired, {
	valid: [
		{
			code: 'export const WithStories = () => null',
			filename: `${FIXTURES}src/components/WithStories/WithStories.tsx`,
		},
		// Outside the shared tier the rule does not apply.
		{
			code: 'export const Tile = () => null',
			filename: '/repo/src/features/game/components/Tile/Tile.tsx',
		},
		// Stories and spec files themselves are exempt.
		{
			code: 'export default {}',
			filename: `${FIXTURES}src/components/NoStories/NoStories.stories.tsx`,
		},
		{
			code: 'it("renders", () => {})',
			filename: `${FIXTURES}src/components/NoStories/NoStories.spec.tsx`,
		},
		// Private sub-components are exempt.
		{
			code: 'export const Inner = () => null',
			filename: `${FIXTURES}src/components/NoStories/components/Inner/Inner.tsx`,
		},
	],
	invalid: [
		{
			code: 'export const NoStories = () => null',
			filename: `${FIXTURES}src/components/NoStories/NoStories.tsx`,
			errors: [{ messageId: 'missingStories' }],
		},
		// Flat shared component without stories.
		{
			code: 'export const Flat = () => null',
			filename: `${FIXTURES}src/components/Flat.tsx`,
			errors: [{ messageId: 'missingStories' }],
		},
	],
})

ruleTester.run('spec-in-module-folder', specInModuleFolder, {
	valid: [
		{ code: 'export {}', filename: '/src/engine/board/board.spec.ts' },
		{ code: 'export {}', filename: '/src/machines/game-machine/game-machine.spec.ts' },
		{ code: 'export {}', filename: '/src/features/game/components/Tile/Tile.spec.tsx' },
		// Not a spec — the rule has no opinion on where plain modules sit.
		{ code: 'export {}', filename: '/src/engine/types.ts' },
	],
	invalid: [
		{
			code: 'export {}',
			filename: '/src/engine/board.spec.ts',
			errors: [{ messageId: 'wrongFolder' }],
		},
		{
			code: 'export {}',
			filename: '/src/lib/i18n/utils/detect-locale.spec.ts',
			errors: [{ messageId: 'wrongFolder' }],
		},
	],
})

const IMPORT = "import { renderWithProviders } from '@testing'\n"

ruleTester.run('render-through-render-component', renderThroughRenderComponent, {
	valid: [
		{
			code: `${IMPORT}const renderComponent = (props) => renderWithProviders(<Icon {...props} />)`,
			filename: 'Icon.spec.tsx',
		},
		{
			code: `${IMPORT}const renderComponent = (...icons) => {\n\treturn renderWithProviders(<Icon />)\n}`,
			filename: 'Icon.spec.tsx',
		},
		// The prose prescribes no syntax, so a function declaration is equally fine.
		{
			code: `${IMPORT}function renderComponent(props) {\n\treturn renderWithProviders(<Icon {...props} />)\n}`,
			filename: 'Icon.spec.tsx',
		},
		{
			code: `${IMPORT}it("renders", () => { renderComponent({ name: "x" }) })`,
			filename: 'Icon.spec.tsx',
		},
		// Node-project specs render nothing — the helper is a component-spec pattern.
		{ code: `${IMPORT}renderWithProviders(element)`, filename: 'board.spec.ts' },
		{ code: `${IMPORT}renderWithProviders(<Icon />)`, filename: 'render-with-providers.tsx' },
	],
	invalid: [
		{
			code: `${IMPORT}it("renders", () => { renderWithProviders(<Icon />) })`,
			filename: 'Icon.spec.tsx',
			errors: [{ messageId: 'renderThroughHelper' }],
		},
		{
			code: `${IMPORT}const renderOther = (props) => renderWithProviders(<Icon {...props} />)`,
			filename: 'Icon.spec.tsx',
			errors: [{ messageId: 'renderThroughHelper' }],
		},
		// A helper per describe block is the drift the rule exists to stop.
		{
			code: `${IMPORT}describe("Icon", () => {\n\tconst renderComponent = (props) => renderWithProviders(<Icon {...props} />)\n})`,
			filename: 'Icon.spec.tsx',
			errors: [{ messageId: 'renderThroughHelper' }],
		},
		{
			code: `${IMPORT}it("renders", () => {\n\tconst renderComponent = () => renderWithProviders(<Icon />)\n})`,
			filename: 'Icon.spec.tsx',
			errors: [{ messageId: 'renderThroughHelper' }],
		},
		// Renaming the import must not walk past the rule.
		{
			code: 'import { renderWithProviders as renderIt } from \'@testing\'\nit("renders", () => { renderIt(<Icon />) })',
			filename: 'Icon.spec.tsx',
			errors: [{ messageId: 'renderThroughHelper' }],
		},
		// A no-argument helper cannot vary cases, which is the point of having one.
		{
			code: `${IMPORT}const renderComponent = () => renderWithProviders(<Icon />)`,
			filename: 'Icon.spec.tsx',
			errors: [{ messageId: 'helperTakesArguments' }],
		},
	],
})
