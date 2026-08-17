# sliding-puzzle

A sliding puzzle game: React 19 + TypeScript + Vite. Pure engine under `src/engine/`,
XState game machine, CSS Modules + generated design tokens.

Read [CONTEXT.md](CONTEXT.md) for the domain vocabulary (Board, Tile, Gap, Move, …) and
use it exactly — "puzzle" is banned as a code term. Decisions with rationale live in
[docs/adr/](docs/adr/). Detailed conventions live in [docs/conventions/](docs/conventions/)
and load automatically as path-scoped rules when you touch matching files.

## Commands

- **Lint** — `pnpm lint` (ESLint + Stylelint) · **Fix** — `pnpm lint:fix`
- **Typecheck** — `pnpm typecheck` · **Test** — `pnpm test` · **Build** — `pnpm build`
- **Tokens** — `pnpm tokens` (rebuilds `src/styles/tokens.css` from `tokens/*.json`)
- **Messages** — `pnpm i18n:extract` (rebuilds `src/lib/i18n/locales/en.json`)
- **Storybook** — `pnpm storybook`

Formatting is automatic — a PostToolUse hook runs Prettier on every file you edit
(tabs in code, 2-space JSON/YAML/MD, single quotes, no semicolons, 100 cols). Don't
hand-format.

## Must-follow rules

Most conventions are lint-enforced (including the custom
`tools/eslint-plugin-sliding-puzzle` rules) — trust the linter. The ones it can't check:

- **The engine is pure** (ADR-0001): no React/XState/DOM imports under `src/engine/` —
  anything it needs is an argument. Components stay presentational; lifecycle lives in
  the game machine.
- **Colocate by default; promote on the 2nd consumer**: component-local →
  `src/features/<feature>/` → `src/components/`. Never create a shared bucket
  pre-emptively. One exception (ADR-0009): components defined in the Figma design
  system are born shared in `src/components/`. Source images are likewise born
  shared in `src/source-images/`, imported only via its typed registry.
- **Imports flow one way** (ADR-0007): `engine → lib → components → features → app`.
  Features never import each other. Aliased modules are reached only by their alias —
  `@engine`, `@i18n`, `@messages`, `@testing`, `@components/<Name>` — never the long
  `@/...` form.
- **Never import `react-intl`** (ADR-0008): all localization goes through the
  `@i18n` facade. Messages live in `translation-messages.ts` beside their
  component; regenerate `en.json` with `pnpm i18n:extract`.
- **Query by accessible identity in tests** (ADR-0005); `getByTestId` only where no
  accessible identity exists. Testids stay **mandatory** on interactive and
  state-bearing elements.
- **WCAG 2.2 AA** is a design constraint: tiles carry accessible names, moves are
  announced, everything is keyboard-operable.
- **Never edit `src/styles/tokens.css`** — it is generated (ADR-0006); change
  `tokens/manual/*.json` (hand-owned tier) or re-export `tokens/figma/*.json`
  from Figma via TokensBrücke (ADR-0010), then run `pnpm tokens`.
- **No runtime UI or animation libraries** (ADR-0011): primitives are hand-rolled
  on native elements and platform APIs; the only design-driven packages are
  `lucide-react` and `@fontsource` fonts.

To add or change a convention, use the `/update-conventions` skill.

## Git workflow

- Conventional Commits (`<type>(<scope>): <desc>`); branch names `<type>/<short-desc>`.
- PRs **squash-merge**; the PR title becomes the commit subject on main, so PR
  titles are Conventional Commits too (CI-checked by `pr-title.yml`).
- **Checkpoint commits**: `pnpm cp` creates a hook-bypassing commit with subject `CP`.
  Local history is scratch, pushed history is public — the pre-push hook rejects any
  push containing `CP` commits; squash or reword them first.
- Feature branches may be pushed; **main is never pushed directly** — the
  pre-push hook rejects it, main moves through merged PRs only. Hard-resets,
  force-cleans, and force-pushes stay blocked by a PreToolUse hook.

## Agent skills

### Issue tracker

Issues live in the Sliding puzzle Linear workspace (team `Sliding puzzle`, key `SLI`),
driven via the Linear MCP tools. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name. See
`docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
