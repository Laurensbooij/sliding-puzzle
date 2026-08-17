---
paths:
  - '**/*.spec.ts'
  - '**/*.spec.tsx'
  - 'vitest.config.ts'
  - 'vitest.setup.ts'
---

# Testing conventions

Two Vitest projects, split by file extension: **`.spec.ts` runs in node** (engine
rules, catalogues, lint rules, hooks — no DOM) and **`.spec.tsx` runs in jsdom**
with Testing Library. Specs are colocated.

Accessibility gates and the per-component a11y acceptance criteria live in
[accessibility.md](accessibility.md).

## Rendering

Render through **`renderWithProviders`** from `@testing`, never RTL's `render`
directly — components need the i18n provider, and the helper supplies the real
message catalogues rather than mocks. Pass `{ locale: 'nl' }` to render under
another locale.

## Queries — accessible identity first (ADR-0005)

- Query by **`getByRole` / `getByLabelText`** first. When `getByRole` fails, suspect
  an accessibility bug before reaching for an escape hatch.
- `getByTestId` only for elements with **no accessible identity** (decorative layers,
  the gap) — and then always via the `*_TESTIDS` constants, never a raw string.
- Enforced by `eslint-plugin-testing-library`; stories are documentation and Chromatic
  snapshots, not tests.

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
