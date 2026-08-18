---
paths:
  - 'src/components/**'
  - 'src/features/**'
  - 'src/source-images/**'
  - 'src/App.tsx'
---

# Component conventions

## Shape

- Arrow-function component typed **`: FC<ComponentNameProps>`** (`import type { FC }
from 'react'`). Props type named exactly **`ComponentNameProps`**, exported
  (lint-enforced: `sliding-puzzle/props-type-naming`).
- **The props type lives in the component file, directly above the component** — a
  deliberate exception to keeping types in `types.ts` (lint-enforced:
  `sliding-puzzle/props-type-in-component-file`). A component's props are its
  signature: putting them one file away costs a jump for the one thing every reader
  needs first, and a props type has exactly one consumer by definition, so the
  colocation ladder would never promote it anyway. `types.ts` stays the home for
  view-model and helper types the component uses but does not expose.
- Extend the underlying native element's props when wrapping one. Destructure props in
  the signature with inline defaults.
- Keep components presentational: game logic lives in the engine, lifecycle in the game
  machine. Components send events and read state via selectors.

## Folders

- **Colocate by default; promote on the 2nd consumer.** Tiers: component-local →
  feature (`src/features/<feature>/`) → shared (`src/components/`). Don't skip tiers
  "just in case".
- **Exception — design-system components are born shared.** A component defined in
  the Figma design system starts in `src/components/`; its consumers are designed
  screens, not speculation ([ADR-0009](../adr/0009-design-system-components-are-born-shared.md)).
  Game-domain components (Board, Tile, Frame) stay in the game feature.
- A trivial component is flat colocated files. Once it grows satellites (spec, hook,
  helper, constants, sub-component) it graduates to a `ComponentName/` folder with an
  `index.ts` barrel — a specced module shares a folder named after it (lint-enforced:
  `sliding-puzzle/spec-in-module-folder`). Private sub-components live under its `components/`, are full
  components recursively, and are never exported from the folder's barrel.
- Local hooks → `hooks/use-x/` (hook + spec). Local helpers → `utils/`. Local
  constants → unprefixed `constants.ts`. Local messages →
  `translation-messages.ts` (see [i18n.md](./i18n.md)). Naming:
  `PascalCase.tsx` components, `kebab-case` everything else (lint-enforced:
  `check-file`). PascalCase marks a _component_ — a helper that merely contains
  JSX stays kebab-case.
- **Each component folder keeps an `index.ts` barrel.** That is one file
  re-exporting one component plus its testids — an entry point, not the
  whole-subtree re-export that `setup-ts-deep-modules` warns against. Do not
  add barrels that re-export a directory tree.

## Imports

- Reach aliased modules by their alias only — `@engine`, `@i18n`, `@messages`,
  `@testing`, and shared components as `@components/<Name>`. The long `@/...`
  spelling for those targets is a lint error, and everything else uses `@/*`. See
  [ADR-0007](../adr/0007-module-boundaries-and-import-aliases.md).
- **Features never import other features.** Compose them at the app level.
  Shared components and `src/lib/` may not import features either.

## Dependencies

- **Platform first — no runtime UI libraries** (ADR-0011). Build-time transforms
  (`vite-plugin-svgr`) are out of that ADR's scope — it governs what ships to the
  browser. Primitives build on
  native elements (`<dialog>`, checkbox, radios, `<select>`) and platform APIs
  (popover, anchor positioning). Not machine-checked — guard it in review.
- Design-driven packages are limited to `lucide-react` (icons) and
  `@fontsource` fonts. No animation library — motion is CSS over tokens.
- A UI library needs both: a genuinely large ARIA pattern **and** no native
  element for it. Pick the library when that day comes, not before.

## Source images

- **Source images are born shared in `src/source-images/`.** The game feature renders
  them; the Setup screen will enumerate them. Same rationale as ADR-0009.
- **Import only through the typed registry** — `src/source-images/index.ts` exports a
  `SourceImageName` union and a `Record<SourceImageName, FC<SVGProps<SVGSVGElement>>>`
  of `?react` imports. Never hard-code an asset path: a missing source image must be a
  type error, not a 404 (lint-enforced: `no-restricted-imports` blocks
  `@/source-images/vectors/*`).
- **Never serve assets from `public/`.** A Vite import fails the build when the file
  is gone and drops it from the bundle when nothing renders it; `public/` does
  neither.
- **A Tile shows its fragment with a full-board inline `<svg>`** — the registry entry
  rendered as a component, sized `boardDimension × 100%`, offset by the tile's
  home-cell percentages, `preserveAspectRatio="none"`, and `aria-hidden` because it is
  decorative. No build-time slicing: any board dimension works.
- **The ink is the consumer's, never the file's.** Source images paint in
  `currentColor`; the renderer sets `color: var(--art-ink)`. An `<img>` cannot do this
  — it renders in a document of its own where `currentColor` can only resolve to black
  — which is why the fragment is inlined ([ADR-0013](../adr/0013-source-images-render-inline-not-as-img.md)).
  A literal colour in a vector file is a test failure (`source-images.spec.ts`).

## Storybook

- **Every shared component ships colocated stories** (`ComponentName.stories.tsx`)
  covering each designed variant (lint-enforced:
  `sliding-puzzle/stories-file-required`).
- Storybook is the **visual-acceptance surface**: a component is done when its
  stories match the Figma design system's component set. Figma is the source of
  truth; the Claude Design prototypes are input, not canon.
- Feature components may have stories (Tile does); only the shared tier requires
  them.
- **Pointer-transient states (`:hover`, `:active`) are forced via
  `storybook-addon-pseudo-states`**, not simulated: `parameters: { pseudo:
{ hover: true, active: true } }`. Play-function `userEvent` dispatches
  synthetic events, which never match CSS pseudo-classes — a "hover story"
  built that way renders the default state and asserts nothing. Real focus is
  different: `userEvent.tab()` moves actual DOM focus, so `:focus-visible`
  stories use it and stay honest. The addon is dev tooling, not a runtime UI
  library, so ADR-0011 is untouched. Limitation: it rewrites stylesheets, so
  user-agent pseudo styles don't show — irrelevant while controls paint their
  own states over tokens.

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
