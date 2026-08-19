---
paths:
  - 'src/components/**'
  - 'src/widgets/**'
  - 'src/features/**'
  - 'src/app/**'
  - '.storybook/**'
---

# Accessibility conventions

WCAG **2.2 AA** is a baseline requirement, not a nice-to-have. This doc records how
adherence is _ensured_ per component: the gate stack, the acceptance-criteria
template, and the manual remainder. Decided in
[SLI-12](https://linear.app/sliding-puzzle/issue/SLI-12).

## Gate stack

Four automated layers. Each catches what the previous one can't.

- **Lint** — `eslint-plugin-jsx-a11y` (active in `eslint.config.mjs`). Static JSX
  checks in editor and CI. No runtime DOM, no contrast.
- **Story scans** — every story gets a real-browser axe scan via
  **`@storybook/addon-vitest`** (Vitest browser mode, Playwright Chromium). The
  storybook project runs inside plain `pnpm test`; `a11y.test: 'error'` in
  `.storybook/preview.tsx` fails CI on violations. Enable the **`target-size`** rule
  (SC 2.5.8) explicitly — axe ships it off by default, and it is the only
  automatable WCAG 2.2 check.
- **Contrast** — carried by the story layer. Real Chromium computes color-contrast
  (jsdom can't). Every visual state must appear in a story (lint-enforced), so a
  token change that breaks contrast fails CI.
- **Chromatic** — baseline a11y regression tracking on PRs; flags new violations.

**Deferred / rejected:**

- **Token-level contrast script** (fg/bg pair manifest + colorjs.io) — deferred.
  Trigger: adopt it the first time a contrast bug ships past the story layer.
- **vitest-axe** — rejected. Prerelease, duplicates the story layer, and axe can't
  check contrast in jsdom.
- **Playwright e2e + axe** — deferred until full-page scans or end-to-end keyboard
  flows are needed.

## Behavioral coverage

Automated axe finds roughly **57% of issues by volume** and almost nothing
2.2-specific. Keyboard operation, focus behavior, and announcements are asserted in
colocated specs — query by accessible identity (ADR-0005,
[testing.md](testing.md)).

## Acceptance-criteria template

Every component implementation ticket carries this checklist, **pasted in full** —
never linked. "Where applicable" items require an explicit **N/A** in the ticket;
silent skips are not allowed.

```markdown
## Accessibility acceptance criteria

- [ ] Accessible name: role + name asserted in a spec
- [ ] Keyboard: full operation map asserted in a spec
- [ ] Focus: visible indicator; focus never obscured (SC 2.4.11)
- [ ] Announcements: state changes asserted via aria-live specs — or explicit N/A
- [ ] Target size ≥ 24px (SC 2.5.8)
- [ ] Every visual state/variant rendered in a story
- [ ] Reduced motion respected (token-level collapse, ADR-0010)
- [ ] Manual keyboard pass done by the PR author
```

## Manual remainder

- **Per component**: the PR author runs a keyboard pass (last checklist item).
- **Post-adoption**: one VoiceOver/Safari pass over the Play and Solved surfaces once
  game-feature adoption completes. Run an ad-hoc pass when a live-announcement
  component lands (Board/Tile moves, Dialog).
- **N/A determinations**: Consistent Help (3.2.6), Redundant Entry (3.3.7), and
  Accessible Authentication (3.3.8) are N/A — no help system, no multi-step forms,
  no auth. Revisit if any of those appear.
