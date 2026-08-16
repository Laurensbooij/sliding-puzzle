# sliding-puzzle

## Project setup

### Stack

- **React 19** + **TypeScript** + **Vite**.
- **XState** for game lifecycle (idle, playing, solved).
- **CSS Modules** + design tokens generated from Figma via **Style Dictionary**.
- **Vitest** in two projects — `node` (`.spec.ts`, no DOM) and `components` (`.spec.tsx`, jsdom) — with **Testing Library**.
- **react-intl** behind a facade for localization. English default, Dutch supported.
- **Storybook** + **Chromatic** for component docs and visual regression.
- **pnpm** + **Node 24**.

### Getting started

Prerequisites:

- **Node 24** — use the version pinned in `.nvmrc` (`nvm use`).
- **pnpm** — see `packageManager` in `package.json`.

Install and run:

```bash
pnpm install
pnpm dev
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

`cp` bypasses git hooks (`--no-verify`) for fast local snapshots. **`CP` commits can never be pushed** — a pre-push hook rejects them. Squash or reword them before pushing.

### Architecture in brief

- **Pure engine** — `src/engine/` holds all board rules. No React, XState, or DOM imports; lint-enforced. See [ADR-0001](docs/adr/0001-pure-engine-separate-from-react.md).
- **Random-walk shuffle** — shuffling walks from the solved board through random legal moves, so every board is solvable by construction. See [ADR-0002](docs/adr/0002-shuffle-by-random-walk.md).
- **XState lifecycle** — a game machine owns idle/playing/solved state; the engine stays the sole authority on legal moves. See [ADR-0003](docs/adr/0003-game-lifecycle-on-an-xstate-machine.md).
- **Components are presentational** — they send events and read machine state; they never decide game rules.

Full rationale for each decision lives in [docs/adr/](docs/adr/).

### Module boundaries

Code flows one way — **`engine → lib → features → app`** — and features never import each other. Both directions are lint-enforced. See [ADR-0007](docs/adr/0007-module-boundaries-and-import-aliases.md).

Four modules carry a named import alias; everything else uses `@/*`. A named alias means **"a stable module with a public API you may depend on"**, and an aliased module may _only_ be reached that way — the long `@/...` spelling is a lint error.

| Alias       | Module                                    |
| ----------- | ----------------------------------------- |
| `@engine`   | The pure board engine.                    |
| `@i18n`     | The localization facade.                  |
| `@messages` | Globally reusable translation messages.   |
| `@testing`  | `renderWithProviders` and test utilities. |

Aliases are declared once in `tsconfig.paths.json`; TypeScript, Vite, Vitest and Storybook all read them from there.

### Localization

English is the default; Dutch is supported. The locale is detected from the browser and falls back to English.

**Never import `react-intl`** — it is confined by lint to `src/lib/i18n`, and everything else uses the `@i18n` facade (`useTranslate`, `Message`, `createTranslate`, `useLocale`). See [ADR-0008](docs/adr/0008-react-intl-behind-a-facade.md).

Messages are declared with `defineMessages` in a `translation-messages.ts` beside the component that uses them, with explicit namespaced ids and a `description` for whoever translates them. Run **`pnpm i18n:extract`** after changing one and commit the regenerated `en.json`; write the Dutch into `nl.json` by hand.

CI fails when extraction is not a no-op or when the two catalogues carry different keys — react-intl falls back silently, so a missing Dutch key would otherwise ship English text into the Dutch UI.

### Conventions & enforcement

Detailed conventions live in `docs/conventions/` (engine, components, styling, testing, i18n). Path-scoped rules load them for humans and agents alike:

- `.claude/rules/` symlinks each convention file.
- `AGENTS.md` symlinks `CLAUDE.md`.

See [ADR-0004](docs/adr/0004-conventions-split-by-purpose-not-audience.md) for why conventions split by purpose, not audience.

Enforcement runs through tooling, not review discipline:

- **ESLint** — includes five custom rules in `tools/eslint-plugin-sliding-puzzle/`: `props-type-naming`, `props-type-in-component-file`, `assign-before-assert`, `no-inline-testid`, `testids-in-constants-file`.
- **Stylelint** — enforces design-token usage and unit rules (`rem` for scalable sizing, `px` only for borders/shadows).
- **Prettier** — formats on every edit.
- **Husky** — pre-commit runs `lint-staged`; pre-push blocks `CP` commits.
- **CI** (GitHub Actions) — runs format check, lint, typecheck, test, and build on every push and PR.
- **Chromatic** — runs visual regression on every PR.

## Development process

Built in phases, documented with screenshots: [docs/journey](docs/journey/README.md).
