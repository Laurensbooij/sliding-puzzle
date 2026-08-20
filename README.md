# sliding-puzzle

A sliding puzzle: shuffle a board of tiles, then slide them back into place. Built from a
Figma design system: tokens, components and every screen, all kept in sync with the code.

**Design system:** the [Slider puzzle Figma file](https://www.figma.com/design/r5wlPxDsJnLjZGJcrvmj9s/Slider-puzzle?node-id=0-1&t=UuGmFAnJnpKF6UKG-1)

## Project setup

### Stack

- **React 19** + **TypeScript** + **Vite**.
- **XState** for game lifecycle (idle, playing, solved).
- **CSS Modules** + design tokens generated from Figma via **Style Dictionary**.
- **Vitest** in two projects: `node` (`.spec.ts`, no DOM) and `components` (`.spec.tsx`, jsdom), with **Testing Library**.
- **react-intl** behind a facade for localization. English default, Dutch supported.
- **Storybook** + **Chromatic** for component docs and visual regression.
- **pnpm** + **Node 24**.

### Getting started

Prerequisites:

- **Node 24**: use the version pinned in `.nvmrc` (`nvm use`).
- **pnpm**: see `packageManager` in `package.json`.

Install once:

```bash
pnpm install
```

Run the app (Vite, on `localhost:5173`):

```bash
pnpm dev
```

Run Storybook (component docs, on `localhost:6006`):

```bash
pnpm storybook
```

### Commands

| Command             | Does                                                  |
| ------------------- | ----------------------------------------------------- |
| `pnpm dev`          | Start the Vite dev server.                            |
| `pnpm build`        | Typecheck and build for production.                   |
| `pnpm lint`         | Run ESLint and Stylelint.                             |
| `pnpm lint:fix`     | Run lint and auto-fix.                                |
| `pnpm typecheck`    | Run `tsc -b --noEmit`.                                |
| `pnpm test`         | Run all Vitest projects.                              |
| `pnpm tokens`       | Rebuild `src/styles/tokens.css` from `tokens/*.json`. |
| `pnpm i18n:extract` | Rebuild `src/lib/i18n/locales/en.json` from source.   |
| `pnpm storybook`    | Start Storybook on port 6006.                         |
| `pnpm cp`           | Create a checkpoint commit (subject `CP`).            |

`cp` bypasses git hooks (`--no-verify`) for fast local snapshots. **`CP` commits can never be pushed**: a pre-push hook rejects them. Squash or reword them before pushing.

### Architecture in brief

- **Pure engine**: `src/engine/` holds all board rules, with no React, XState, or DOM imports (lint-enforced). See [ADR-0001](docs/adr/0001-pure-engine-separate-from-react.md).
- **Random-walk shuffle**: shuffling walks from the solved board through random legal moves, so every board is solvable by construction. See [ADR-0002](docs/adr/0002-shuffle-by-random-walk.md).
- **XState lifecycle**: a game machine owns idle/playing/solved state, and the engine stays the sole authority on legal moves. See [ADR-0003](docs/adr/0003-game-lifecycle-on-an-xstate-machine.md).
- **Components are presentational**: they send events and read machine state, and never decide game rules.

Full rationale for each decision lives in [docs/adr/](docs/adr/).

### Module boundaries

Code flows one way: **`engine → lib → {machines | components} → widgets → features → app`**.
Features never import each other, widgets never import each other, and machines and
components never import each other. Both directions are lint-enforced. See
[ADR-0007](docs/adr/0007-module-boundaries-and-import-aliases.md).

Nine modules carry a named import alias, plus three glob aliases for the shared tiers.
Everything else uses `@/*`. A named alias means **"a stable module with a public API you
may depend on."** An aliased module may _only_ be reached that way: the long `@/...`
spelling is a lint error, and for the glob tiers so is anything deeper than the barrel.

| Alias                                   | Module                                    |
| --------------------------------------- | ----------------------------------------- |
| `@engine`                               | The pure board engine.                    |
| `@i18n`                                 | The localization facade.                  |
| `@messages`                             | Globally reusable translation messages.   |
| `@testing`                              | `renderWithProviders` and test utilities. |
| `@css-utils`                            | The class-name composition helper.        |
| `@game-config`, `@records`, `@settings` | The three state homes (ADR-0015).         |
| `@source-images`                        | The typed source-image registry.          |
| `@components/<Name>`                    | Shared, product-agnostic primitives.      |
| `@machines/<name>`                      | Shared XState machines.                   |
| `@widgets/<Name>`                       | Shared, product-specific composites.      |

Aliases are declared once in `tsconfig.app.json`; TypeScript, Vite, Vitest and Storybook all read them from there.

### Localization

English is the default; Dutch is supported. The locale is detected from the browser and falls back to English.

**Never import `react-intl`**: it is confined by lint to `src/lib/i18n`, and everything else uses the `@i18n` facade (`useTranslate`, `Message`, `createTranslate`, `useLocale`). See [ADR-0008](docs/adr/0008-react-intl-behind-a-facade.md).

Messages are declared with `defineMessages` in a `translation-messages.ts` beside the component that uses them, with explicit namespaced ids and a `description` for whoever translates them. Run **`pnpm i18n:extract`** after changing one and commit the regenerated `en.json`; write the Dutch into `nl.json` by hand.

CI fails when extraction is not a no-op, or when the two catalogues carry different keys. react-intl falls back silently, so a missing Dutch key would otherwise ship English text into the Dutch UI.

### Conventions & enforcement

Detailed conventions live in `docs/conventions/` (engine, components, styling, testing, i18n). Path-scoped rules load them for humans and agents alike:

- `.claude/rules/` symlinks each convention file.
- `AGENTS.md` symlinks `CLAUDE.md`.

See [ADR-0004](docs/adr/0004-conventions-split-by-purpose-not-audience.md) for why conventions split by purpose, not audience.

Enforcement runs through tooling, not review discipline:

- **ESLint**: five custom rules in `tools/eslint-plugin-sliding-puzzle/`: `props-type-naming`, `props-type-in-component-file`, `assign-before-assert`, `no-inline-testid`, `testids-in-constants-file`.
- **Stylelint**: enforces design-token usage and unit rules (`rem` for scalable sizing, `px` only for borders/shadows).
- **Prettier**: formats on every edit.
- **Husky**: pre-commit runs `lint-staged`; pre-push blocks `CP` commits.
- **CI** (GitHub Actions): runs format check, lint, typecheck, test, and build on every push and PR.
- **Chromatic**: runs visual regression on every PR.

## Development process

This app was built in phases with **Claude Code**, in a repeatable loop:

1. **Research and spec first.** Open questions run as research tickets or "grilling"
   interviews, structured rounds that turn a design tree into settled decisions, before
   any code gets written.
2. **Build in parallel waves.** Once tickets are unblocked and independent, several
   Claude Code agent sessions build them at the same time.
3. **I review everything.** Every change lands through a PR I read and approve. The
   agents propose; I stay the one responsible for what ships.

Quality runs the same way, through tooling rather than review discipline: **CI** checks
format, lint, types, tests and the build on every push; **Chromatic** catches visual
regressions; a **WCAG AA checklist** gates every design-system ticket. See
[Conventions & enforcement](#conventions--enforcement) above for the full list.

Each phase is written up with screenshots and the decisions behind it, including what got
tried and reconsidered: [docs/journey](docs/journey/README.md).
