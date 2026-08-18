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

## Tokens (ADR-0006, ADR-0010)

- **Every design value comes from `src/styles/tokens.css`** — no literal colors,
  spacing, fonts, shadows, or durations (lint-enforced by Stylelint's
  `declaration-strict-value` and the duration disallowed-list).
- `tokens.css` is **generated — never edit it by hand.** Two source tiers, both
  DTCG JSON, one build (`pnpm tokens`):
  - **`tokens/figma/`** — TokensBrücke export from Figma. Never hand-edit;
    re-export replaces it wholesale. Export profile: DTCG 2025.10 **on**,
    style export **on**, split by collection, hex colors.
  - **`tokens/manual/`** — hand-owned: materials (wood/glass gradient stacks
    plus glass blur/border/glow extras) and composed `transition` shorthands.
    Easings ship in the export as Motion `ease/*` string variables, and `font`
    shorthands are generated from its Typography styles — neither is manual.
    The design prototype's CSS is the reference when updating this tier.
    Manual `material/*` entries deliberately override the export's same-named
    gradient styles: Figma's gradients lose their angles on export.
- **CSS variable names mirror Figma variable paths** (`space/3` → `--space-3`).
  Never invent a differently-named alias for an existing token.
- Export workflow: run TokensBrücke in Figma → save into `tokens/figma/` →
  `pnpm tokens` → commit JSON + regenerated `tokens.css` together. CI fails on
  drift between the two.

## Fonts

- Typefaces (Outfit, Public Sans, IBM Plex Mono) are **self-hosted via
  `@fontsource` packages** — no font CDN requests. Subset imports, woff2,
  `font-display: swap`.
- Components reference families only through tokens (`--family-display`,
  `--family-ui`, `--family-numeric`).

## Units (lint-enforced)

- **`rem`** for sizes, spacing, typography, radii — they must scale with the user's
  root font size (accessibility requirement).
- **`px`** only for borders, outlines, and shadow geometry — device-pixel details that
  shouldn't scale.
- Unitless `line-height`. Mobile-first `min-width` media queries in `rem`/`em`.

## Motion

- **All durations and easings come from motion tokens** (`--dur-…`, `--ease-…`,
  composed `--transition-…`) — a literal `200ms` in CSS is a lint error.
  JS-orchestrated motion reads the same tokens via `getComputedStyle`; never
  hard-code a duration in TS either.
- `prefers-reduced-motion` is honored at the token layer:
  `src/styles/motion-preferences.css` (hand-authored) collapses duration tokens
  to 1ms, which silences token-reading JS automatically. The global reset's
  blanket kill switch stays as the safety net — don't fight either.
