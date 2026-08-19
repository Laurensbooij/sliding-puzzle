---
paths:
  - '**/*.spec.ts'
  - '**/*.spec.tsx'
  - 'vitest.config.ts'
  - 'vitest.setup.ts'
---

# Testing conventions

Three Vitest projects. Two split by file extension: **`.spec.ts` runs in node**
(engine rules, catalogues, lint rules, hooks — no DOM) and **`.spec.tsx` runs in
jsdom** with Testing Library. Specs are colocated. The third, **`storybook`**, scans
every story with axe in headless Chromium. See
[accessibility.md](accessibility.md).

Accessibility gates and the per-component a11y acceptance criteria live in
[accessibility.md](accessibility.md).

**A specced module lives in a folder named after it** (lint-enforced:
`sliding-puzzle/spec-in-module-folder`): `board/board.ts` + `board/board.spec.ts`,
`Tile/Tile.tsx` + `Tile/Tile.spec.tsx`. The pair is one unit; the folder keeps it
one as satellites accumulate. Modules without a spec may stay flat.

## Rendering

Render through **`renderWithProviders`** from `@testing`, never RTL's `render`
directly — components need the i18n provider, and the helper supplies the real
message catalogues rather than mocks. Pass `{ locale: 'nl' }` to render under
another locale.

**Each `.spec.tsx` declares one top-level `renderComponent` helper that takes
arguments, and only that helper calls `renderWithProviders`** (lint-enforced:
`sliding-puzzle/render-through-render-component`). Cases vary by argument, not by
rebuilding the JSX:

```tsx
const renderComponent = (
  props: Partial<TileProps> = {},
  options?: RenderWithProvidersOptions,
): RenderResult => renderWithProviders(<Tile tile={0} {...props} />, options)

it('reports its tile id when pressed while movable', async () => {
  renderComponent({ tile: 3, movable: true, onPress })
  // …
})
```

Per-test render calls drift: each grows its own default props, so the component's
baseline setup ends up restated once per case and one change to it touches every
test. The helper states that baseline once.

- **Shape it to the spec's real needs** — a props object is the common case, but a
  variadic helper is right when cases legitimately render several instances of the
  component. Thread render options through as a second parameter when a case needs
  another locale.
- **A case the helper genuinely cannot express** opts out with an
  `eslint-disable-next-line sliding-puzzle/render-through-render-component`
  carrying the reason. Reach for that only after trying to widen the helper —
  widening it is usually the smaller change.

The rule checks that the helper is declared at module top level, takes at least one
parameter, and is the only caller of `renderWithProviders` — under any import alias.
Whether its arguments are the _right_ ones stays a review judgement.

## Hook specs

A hook whose whole surface is its return value is rendered through
**`renderHookWithProviders`** from `@testing`, not through a probe component built to
display it. Same real providers, same real catalogues; pass the provider under test as
`wrapper`:

```tsx
const renderRecords = (stored?: string) => {
  if (stored !== undefined) localStorage.setItem(RECORDS_STORAGE_KEY, stored)
  return renderHookWithProviders(useRecords, { wrapper: RecordsProvider })
}
```

RTL's bare `renderHook` is a lint error in a spec, exactly as bare `render` is. Name the
helper after what it renders (`renderRecords`, `renderSettings`) — the `renderComponent`
rule above governs component specs and does not apply here. Not machine-checked.

**A hook spec still runs in jsdom**, so it is a `.spec.tsx` file — which the PascalCase
filename rule then applies to. A hook that has a provider puts its spec beside that
provider (`RecordsProvider/RecordsProvider.spec.tsx`) rather than beside the kebab-case
hook module. A hook that has none — `use-media-query/use-media-query.spec.tsx` — keeps
its spec beside itself and stays kebab-case, which the `src/**/use-*.spec.tsx` override
in `eslint.config.mjs` enforces. Inventing a provider just to win a PascalCase filename
would be the tail wagging the dog.

## Storage

`localStorage` is shimmed in `vitest.setup.ts` and cleared after every test. Node 24
ships its own inert `localStorage` global, and Vitest's jsdom environment skips window
keys already on `globalThis`, so without the shim there is no storage at all.

**Assert persistence isolation against raw stored strings**, via `seedStorage` and
`readStorage` from `@testing`. A test that only re-reads its own module's value cannot
fail when a write clobbers a neighbouring key; comparing a `readStorage` snapshot to
what `seedStorage` returned can.

## Media queries

jsdom ships no `matchMedia` at all — not a stub, not a no-op — so anything calling
`useMediaQuery` throws on first render. `vitest.setup.ts` installs the fake from
`src/testing/match-media.ts`, which specs drive: `setMediaQueryMatches(query, matches)`
crosses a breakpoint, `mediaQueryListenerCount(query)` catches a leaked subscription.

It parses nothing — a query string is an opaque key — so a spec asserts **which query
was asked for**, never how a browser would evaluate it. Real evaluation stays a
Chromium question, like the popover and dialog shims beside it.

## Queries — accessible identity first (ADR-0005)

- Query by **`getByRole` / `getByLabelText`** first. When `getByRole` fails, suspect
  an accessibility bug before reaching for an escape hatch.
- `getByTestId` only for elements with **no accessible identity** (decorative layers,
  the gap) — and then always via the `*_TESTIDS` constants, never a raw string.
- Enforced by `eslint-plugin-testing-library`. Stories carry documentation, Chromatic
  snapshots, and axe scans — behavioural assertions live in specs, not stories.

## Style rules

- **Never hardcode asserted copy.** When a string comes from a message, build the
  expected value from that message with `createTranslate()` from `@i18n`:

  ```ts
  const { translate } = createTranslate()
  const tileButton = screen.getByRole('button', {
    name: translate(tileMessages.label, { number: 4 }),
  })
  ```

  This checks the component is wired to the _right message_; whether the copy
  itself reads well is a review and Chromatic question, not a unit-test one. A
  reworded string then breaks nothing.

- **Assign before asserting** (lint-enforced: `sliding-puzzle/assign-before-assert`):
  bind every queried element or result to a descriptively named `const`, then act and
  assert on that binding. Inline queries re-run on every reference and hide
  swapped-element bugs.
- `userEvent.setup()` for interactions; `describe` per component; test names describe
  behaviour, not implementation.
- **Never mock the component under test or the real children it renders.** Mock only
  true external boundaries (time, randomness — via the engine's `random` parameter).
- Typed `it.each` for parametric cases. No `any` in tests; derive expected-value types
  from the component's own types.
