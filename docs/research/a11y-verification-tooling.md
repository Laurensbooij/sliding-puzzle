# Mechanical WCAG 2.2 AA verification for React components

Research date: **2026-08-17**. Versions checked: axe-core 4.x docs, Storybook 10.5 docs,
vitest-axe 1.0.0-pre.5, eslint-plugin-jsx-a11y 6.10.x, Style Dictionary v4/v5 docs.

## Question

Which tools mechanically verify WCAG 2.2 AA for React components? Where does each
fit: editor, test run, Storybook, CI?

## Recommendation

- **Editor / lint**: keep **eslint-plugin-jsx-a11y**. Already wired in via
  `flatConfigs.recommended` (`eslint.config.mjs`).
- **Storybook + CI (primary axe layer)**: use the installed **@storybook/addon-a11y**.
  `parameters.a11y.test: 'error'` is already set in `.storybook/preview.tsx` but
  nothing executes it in CI yet. Add **@storybook/addon-vitest** and run
  `vitest run --project=storybook` in CI. **Chromatic** (installed) adds baseline-based
  a11y regression tracking for free effort.
- **Unit tests**: skip **vitest-axe**. It is thinly maintained and duplicates the
  Storybook axe layer. jsdom also disables color-contrast checks.
- **Tokens**: add a small **build-time contrast script** over declared token pairs,
  using **colorjs.io** `contrastWCAG21()`. Wire it into `scripts/build-tokens.mjs`.
- **Playwright**: defer. Setup from zero is the highest cost here. Add later only for
  full-page scans and end-to-end keyboard-flow assertions.
- **Manual remainder stays manual**: keyboard tile moves, focus order after a move,
  and live-region announcements need behavioral tests plus human screen-reader checks.

## Crosscutting facts

- Deque's own study: automated testing covered **57%** of accessibility issues **by
  issue volume** (300k issues, 13k pages). Not 57% of success criteria.
  Source: <https://www.deque.com/blog/automated-testing-study-identifies-57-percent-of-digital-accessibility-issues/>.
  The axe-core README repeats it: "find on average 57% of WCAG issues automatically"
  (<https://github.com/dequelabs/axe-core>).
- axe-core supports jsdom only partially: "the `color-contrast` rule is known not to
  work with JSDOM" (<https://github.com/dequelabs/axe-core>).
- axe-core ships **one** rule tagged `wcag22aa`: **target-size**. It is **disabled by
  default** "until WCAG 2.2 is more widely adopted and required"
  (<https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md>).
- WCAG 2.2 adds 6 A/AA criteria: **2.4.11 Focus Not Obscured**, **2.5.7 Dragging
  Movements**, **2.5.8 Target Size**, **3.2.6 Consistent Help**, **3.3.7 Redundant
  Entry**, **3.3.8 Accessible Authentication**
  (<https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/>).
  Only 2.5.8 has any axe rule. The rest need manual or bespoke behavioral tests.

## 1. axe-core in unit tests: vitest-axe vs jest-axe

### What it catches

- Rendered-DOM axe scan per component: ARIA validity, names, roles, structure.
- **Not** color contrast: jsdom cannot compute it. jest-axe states "Color contrast
  checks do not work in JSDOM so are turned off in jest-axe"
  (<https://github.com/NickColley/jest-axe>). axe-core confirms the jsdom limitation
  (<https://github.com/dequelabs/axe-core>).
- **Not** keyboard flows, focus order, or live-region behavior.

### Maintenance status (vitest-axe)

- **chaance/vitest-axe** latest stable is **0.1.0** (2022-10-21). Latest release is
  **1.0.0-pre.5** (2025-01-22), still a prerelease
  (<https://registry.npmjs.org/vitest-axe>).
- Peer dependency is `vitest: >=1`, so Vitest 4.1 satisfies the range. Explicit
  Vitest 4 testing is **unverified** — no statement found in the repo.
- Open issues signal thin upkeep: "Incompatibility with jsdom v28" (#30, Feb 2026),
  "request: publish v1.0.0" (#17, open since Aug 2024)
  (<https://github.com/chaance/vitest-axe/issues>). Repo's jsdom 27 predates #30.
- Incompatible with happy-dom; jsdom required (<https://github.com/chaance/vitest-axe>).

### jest-axe

- Requires Jest (<https://github.com/NickColley/jest-axe>). Repo has no Jest.
- Its matchers can extend Vitest's `expect` manually, with type friction —
  **unverified** against Vitest 4.

### Setup cost here

- Low mechanically: `pnpm add -D vitest-axe`, one setup-file import
  (`vitest-axe/extend-expect`).
- Real cost: a prerelease dependency, duplicated coverage with the Storybook layer,
  and no contrast checking in jsdom.

### CI viability and flakiness

- Runs inside `pnpm test`; deterministic in jsdom, no browser needed.
- Slower per test (axe scans are heavy); no flakiness reputation found.

### Sources

- <https://github.com/chaance/vitest-axe>
- <https://github.com/chaance/vitest-axe/issues>
- <https://registry.npmjs.org/vitest-axe>
- <https://github.com/NickColley/jest-axe>

## 2. Storybook addon-a11y (installed) + Vitest addon

### What it catches

- Full axe-core scan of every rendered story, in a **real browser** — so
  **color-contrast works here**, unlike jsdom.
- Panel shows violations, passes, incompletes; toolbar simulates vision impairments
  (<https://storybook.js.org/docs/writing-tests/accessibility-testing>).
- Not: keyboard flows, announcement content, focus-order semantics.

### CI story in Storybook 10

- **`parameters.a11y.test`** controls behavior: `'off'`, `'todo'` (UI warnings only,
  no CI signal), `'error'` (fails UI **and** CI/CLI)
  (<https://storybook.js.org/docs/writing-tests/accessibility-testing>).
- CI path is **@storybook/addon-vitest**: stories become Vitest tests via portable
  stories; a11y runs as a dependent test type alongside them. Requires **Vitest ≥ 3**
  (repo has 4.1), a Vite framework (repo: react-vite), and **Vitest browser mode with
  Playwright Chromium**
  (<https://storybook.js.org/docs/writing-tests/integrations/vitest-addon>).
- Run in CI: `vitest run --project=storybook`.
- Legacy path: **@storybook/test-runner** (Jest + Playwright) is "superseded by the
  Vitest addon" (<https://storybook.js.org/docs/writing-tests/integrations/test-runner>).
  Do not adopt it new.
- **Chromatic 17** (installed): runs axe per story in Capture Cloud, baselines
  violations, and flags only **new/changed** violations — a regression model, not an
  absolute gate (<https://www.chromatic.com/docs/accessibility/>). If Chromatic CI
  already runs, "no changes are needed for accessibility tests to work".

### Setup cost here

- addon-a11y: **zero** — already installed.
- CI gating: `npx storybook add @storybook/addon-vitest`, accept Playwright Chromium
  download, add the CI step. `.storybook/preview.tsx` already sets
  `a11y.test: 'error'` — today it only gates the dev UI, since no test runner
  executes stories.
- Chromatic a11y: near zero on top of existing Chromatic runs.

### CI viability and flakiness

- Vitest addon runs headless Chromium; needs browser binaries in CI images.
- Chromatic runs remotely on standardized Chrome — low local flakiness surface.
- No specific flakiness reputation found for the a11y checks themselves.

### Sources

- <https://storybook.js.org/docs/writing-tests/accessibility-testing>
- <https://storybook.js.org/docs/writing-tests/integrations/vitest-addon>
- <https://storybook.js.org/docs/writing-tests/integrations/test-runner>
- <https://www.chromatic.com/docs/accessibility/>

## 3. eslint-plugin-jsx-a11y (installed, ^6.10.2)

### What it catches

- "Static evaluation of the JSX" — 40+ rules: ARIA prop/role validity, alt text,
  labels, `tabIndex` misuse, click-without-keyboard handlers
  (<https://github.com/jsx-eslint/eslint-plugin-jsx-a11y>).
- Cannot see runtime DOM: no computed names, no contrast, no rendered structure,
  nothing behind dynamic props or spread. The README itself says to pair it with
  runtime axe testing.
- WCAG 2.2 coverage: no 2.2-specific rules exist; static analysis cannot measure
  target size, focus obscuring, or dragging (inference from the rule list).

### Setup cost here

- **Zero**: already in devDeps, and `eslint.config.mjs` already applies
  **`flatConfigs.recommended`** to `src/**/*.{tsx,jsx}`. The plugin also ships
  **`flatConfigs.strict`** for ESLint 9
  (<https://github.com/jsx-eslint/eslint-plugin-jsx-a11y>).

### CI viability and flakiness

- Runs in `pnpm lint`; fully deterministic. Zero flakiness. Also live in-editor.

### Sources

- <https://github.com/jsx-eslint/eslint-plugin-jsx-a11y>

## 4. Playwright + @axe-core/playwright

### What it catches

- Full-**page** axe scans on the running app, including contrast and page-level
  rules (landmarks, document title) that component scans skip.
- Tag filtering via `AxeBuilder.withTags([...])`. axe-core supports `wcag2a`,
  `wcag2aa`, `wcag21a`, `wcag21aa`, and `wcag22aa`
  (<https://github.com/dequelabs/axe-core/blob/develop/doc/API.md>). Note:
  `wcag22aa` currently maps to only **target-size**, which is disabled by default —
  enable it explicitly via the rules option
  (<https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md>).
- Beyond axe: Playwright's role locators and keyboard APIs can assert the
  manual-ish remainder end-to-end — tab order, arrow-key tile moves, focus target
  after a move, `aria-live` text after an action.

### Setup cost here

- **Highest of the five** — repo has no Playwright. Needs `@playwright/test`,
  `@axe-core/playwright`, a config, browser installs, a dev-server fixture, and a CI
  job. Partly amortized if the Storybook Vitest addon already pulls Playwright in.

### CI viability and flakiness

- Standard Playwright CI story; docs stress waiting for UI state before scanning and
  snapshotting violation "fingerprints" (rule id + selector) to avoid brittle diffs
  (<https://playwright.dev/docs/accessibility-testing>).
- Flakiness risk is the usual e2e timing class, not the axe scan itself.

### Sources

- <https://playwright.dev/docs/accessibility-testing>
- <https://github.com/dequelabs/axe-core/blob/develop/doc/API.md>

## 5. Token-level contrast checking at build time

### What it catches

- WCAG 2.x ratio math over `tokens/base.json` + `tokens/semantic.json`:
  **4.5:1** normal text (SC 1.4.3), **3:1** large text and UI components /
  focus indicators (SC 1.4.3, 1.4.11)
  (<https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html>,
  <https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html>).
- This is the **only** automated contrast gate available before a browser renders —
  jsdom tests can't check it, and Storybook only checks rendered stories.

### Key limitation

- Contrast is per foreground/background **pair**. No tool can infer pairings from a
  flat token file. Maintain an explicit pair manifest (e.g.
  `tokens/contrast-pairs.json`: `{ fg, bg, min }`) and check it in the build.

### Implementation options (Style Dictionary 5)

- **Preprocessor hook**: runs on the merged dictionary after parsing, before
  transforms; async supported; registered via `registerPreprocessor` or
  `hooks.preprocessors` (<https://styledictionary.com/reference/hooks/preprocessors/>).
  Good place to fail the build on a bad pair, since references are resolvable.
- **Action hook**: custom code that runs during platform build, after transforms and
  formats (<https://styledictionary.com/reference/hooks/actions/>). Fits "verify then
  report" better than "block early".
- **Simplest**: a standalone script in `scripts/` called from `pnpm tokens`, reading
  resolved token values. No SD coupling.
- Color math: **colorjs.io** `contrastWCAG21()` returns the 1–21 ratio
  (<https://colorjs.io/docs/contrast>). Alternative: **wcag-contrast** (`hex()`,
  `score()`) — tiny but last published **2019-11-05**
  (<https://registry.npmjs.org/wcag-contrast>). The WCAG 2.x formula is frozen, so
  staleness is low-risk; colorjs.io is the safer pick for wide-gamut tokens.
- Stick to WCAG 2.x ratios. **APCA** is a WCAG 3 draft metric, not an AA requirement.

### CI viability and flakiness

- Pure math on JSON: deterministic, instant, zero flakiness. Run in `pnpm tokens`
  and as a CI step.

### Sources

- <https://styledictionary.com/reference/hooks/preprocessors/>
- <https://styledictionary.com/reference/hooks/actions/>
- <https://colorjs.io/docs/contrast>
- <https://registry.npmjs.org/wcag-contrast>

## What no tool catches (this app)

Every layer above is axe-or-static. The remainder maps to this app's core loop:

- **Keyboard tile moves** (SC 2.1.1): axe cannot press keys. Cover with Testing
  Library `userEvent.keyboard` unit tests (already aligned with ADR-0005 role/name
  queries) and, later, Playwright keyboard flows.
- **Focus order after a move** (SC 2.4.3, 2.4.11): assert `document.activeElement`
  after a move in behavioral tests. No scanner checks post-interaction focus.
- **Live-region announcements** (SC 4.1.3): the app announces moves via `aria-live`.
  Tests can assert the region's text content; only a human with a screen reader can
  verify actual announcement timing and verbosity.
- **Target size 2.5.8**: enable axe's `target-size` rule explicitly (disabled by
  default); verify tile hit areas ≥ 24×24 CSS px.
- **2.5.7 / 3.2.6 / 3.3.7 / 3.3.8**: no axe rules; review manually. For this app
  only 2.5.7 plausibly applies (tiles must not require drag-only interaction).

## Comparison table

| Tool                              | Layer            | Catches                                   | Misses                              | Setup cost here                        | CI viability                                           |
| --------------------------------- | ---------------- | ----------------------------------------- | ----------------------------------- | -------------------------------------- | ------------------------------------------------------ |
| eslint-plugin-jsx-a11y            | Editor + lint CI | Static JSX ARIA/semantics                 | Runtime DOM, contrast, behavior     | Zero (installed)                       | Deterministic, in `pnpm lint`                          |
| vitest-axe                        | Unit test run    | axe on jsdom DOM                          | Contrast (jsdom), behavior          | Low, but prerelease dep                | Fine, yet redundant with Storybook layer               |
| addon-a11y + addon-vitest         | Storybook + CI   | Full axe incl. contrast, per story        | Behavior, page-level context        | Low (a11y installed; add vitest addon) | `vitest run --project=storybook`, `a11y.test: 'error'` |
| Chromatic a11y                    | Cloud CI         | axe regressions vs baseline               | Behavior; absolute compliance       | Near zero (Chromatic installed)        | Runs in existing Chromatic builds                      |
| Playwright + @axe-core/playwright | E2E + CI         | Full-page axe + keyboard/focus assertions | Screen-reader UX                    | High (nothing installed)               | Standard e2e; fingerprint snapshots                    |
| Token contrast script             | Build + CI       | Contrast ratios of declared pairs         | Undeclared pairs, rendered overlaps | Small script + pair manifest           | Deterministic, zero flakiness                          |
