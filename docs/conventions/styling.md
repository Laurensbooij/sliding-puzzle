---
paths:
  - '**/*.css'
  - 'tokens/**'
  - 'scripts/build-tokens.mjs'
---

# Styling conventions

CSS Modules (`ComponentName.module.css`, colocated), imported as `styles`, camelCase
class names so dot access works (`styles.iconWrapper`). Keep specificity low — one
class, no IDs, no `!important` (element selectors belong to the global reset only).

## Tokens (ADR-0006)

- **Every design value comes from `src/styles/tokens.css`** — `var(--color-…)`,
  `var(--space-…)`, `var(--radius-…)`, `var(--text-…)`, `var(--shadow-…)`. No literal
  colors, spacing, fonts, or shadows; if a token is missing, add it to `tokens/*.json`
  and run `pnpm tokens` (lint-enforced by Stylelint's `declaration-strict-value`).
- `tokens.css` is **generated — never edit it by hand.** Values originate in Figma;
  the export is a manual plugin click (Enterprise API restriction, see ADR-0006).

## Units (lint-enforced)

- **`rem`** for sizes, spacing, typography, radii — they must scale with the user's
  root font size (accessibility requirement).
- **`px`** only for borders, outlines, and shadow geometry — device-pixel details that
  shouldn't scale.
- Unitless `line-height`. Mobile-first `min-width` media queries in `rem`/`em`.

## Motion

Gate non-essential animation behind `prefers-reduced-motion` (the global reset
hard-disables motion for users who opt out — don't fight it).
