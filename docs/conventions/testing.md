---
paths:
  - '**/*.spec.ts'
  - '**/*.spec.tsx'
  - 'vitest.config.ts'
  - 'vitest.setup.ts'
---

# Testing conventions

Two Vitest projects: **engine** (node, pure functions, no DOM) and **components**
(jsdom + Testing Library). Specs are colocated `*.spec.ts(x)`.

## Queries — accessible identity first (ADR-0005)

- Query by **`getByRole` / `getByLabelText`** first. When `getByRole` fails, suspect
  an accessibility bug before reaching for an escape hatch.
- `getByTestId` only for elements with **no accessible identity** (decorative layers,
  the gap) — and then always via the `*_TESTIDS` constants, never a raw string.
- Enforced by `eslint-plugin-testing-library`; stories are documentation and Chromatic
  snapshots, not tests.

## Style rules

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
