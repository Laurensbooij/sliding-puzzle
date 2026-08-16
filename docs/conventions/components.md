---
paths:
  - 'src/components/**'
  - 'src/features/**'
  - 'src/App.tsx'
---

# Component conventions

## Shape

- Arrow-function component typed **`: FC<ComponentNameProps>`** (`import type { FC }
from 'react'`). Props type named exactly **`ComponentNameProps`**, exported
  (lint-enforced: `sliding-puzzle/props-type-naming`).
- Extend the underlying native element's props when wrapping one. Destructure props in
  the signature with inline defaults.
- Keep components presentational: game logic lives in the engine, lifecycle in the game
  machine. Components send events and read state via selectors.

## Folders

- **Colocate by default; promote on the 2nd consumer.** Tiers: component-local →
  feature (`src/features/<feature>/`) → shared (`src/components/`). Don't skip tiers
  "just in case".
- A trivial component is flat colocated files. Once it grows satellites (hook, helper,
  constants, sub-component) it graduates to a `ComponentName/` folder with an
  `index.ts` barrel. Private sub-components live under its `components/`, are full
  components recursively, and are never exported from the folder's barrel.
- Local hooks → `hooks/use-x/` (hook + spec). Local helpers → `utils/`. Local
  constants → unprefixed `constants.ts`. Naming: `PascalCase.tsx` components,
  `kebab-case` everything else (lint-enforced: `check-file`).

## Test ids

- **Mandatory** on interactive elements, elements carrying variant/state, and anything
  an E2E test would plausibly target. Not on layout wrappers.
- Strings live in a `COMPONENT_NAME_TESTIDS` object (`BASE` + `*_SUFFIX` entries) in
  the component's local `constants.ts` — never inline, never a separate file
  (lint-enforced: `sliding-puzzle/no-inline-testid`,
  `sliding-puzzle/testids-in-constants-file`).
- Reusable components export their testids constant and accept a `dataTestId` prop
  that overrides `BASE`.

## Accessibility

- Target **WCAG 2.2 AA** — and here that is a design constraint, not a checklist: a
  sliding puzzle is a spatial grid, so tiles need accessible names (their number) and
  moves need announcing via a live region.
- Semantic HTML first; ARIA only when no native element fits. Keyboard-operable with
  visible focus. Baseline lint: `jsx-a11y`.
