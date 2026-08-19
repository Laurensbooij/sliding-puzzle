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
    plus glass blur/border/glow extras), composed `transition` shorthands, and
    the responsive breakpoints (Figma has no breakpoint variable to export).
    Easings ship in the export as Motion `ease/*` string variables, and `font`
    shorthands are generated from its Typography styles — neither is manual.
    The design prototype's CSS is the reference when updating this tier.
    Manual `material/*` entries deliberately override the export's same-named
    gradient styles: Figma's gradients lose their angles on export.
    One composed `transition` cannot carry two durations for the same
    property, so a component that animates `transform` on a different beat
    than `--transition-tile` takes its own shorthand
    (`--transition-cell-slide`) rather than overriding a leg locally.
- **CSS variable names mirror Figma variable paths** (`space/3` → `--space-3`).
  Never invent a differently-named alias for an existing token.
- Export workflow: run TokensBrücke in Figma → save into `tokens/figma/` →
  `pnpm tokens` → commit JSON + regenerated `tokens.css` together. CI fails on
  drift between the two.

## Borders and control sizing

- **Draw borders with `border`.** Never fake one that takes no space — no inset
  `box-shadow` ring, no negative `outline-offset`. Figma counts its inside
  strokes in layout (`strokesIncludedInLayout`, which it documents as behaving
  like `box-sizing: border-box`), so both sides already agree on the box and
  there is nothing to compensate for. The old mismatch — a frame reading 40 in
  Figma and rendering 42 — is gone.
- `outline` stays for **focus rings only**, always at a positive offset.
- **Control heights come from `--control-height-sm|md|lg`** — the same
  `control-height/*` variables the Figma components bind their height to. State
  the height once on the outer element and let inner parts fill it
  (`align-items: stretch`) rather than restating a number.
- A Figma **`focus spacer`** layer fakes `outline-offset`, which Figma has no
  property for. Implement the pair as one `outline` plus `outline-offset`, never
  as a second element.

Stylelint guards the first rule, not proves it: it rejects a literal or `calc()`
negative `outline-offset`, and an `inset` shadow composed in `box-shadow` or a
custom property. A value routed through a variable resolves too late to check.
Control heights are review-guarded only — no rule can tell a control's height
from any other height.

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
- Unitless `line-height`. Mobile-first media queries in `rem`/`em`, written in
  **range notation** — `@media (width >= 48rem)`. `stylelint-config-standard`'s
  `media-feature-range-notation` rejects the `min-width:` prefix form, so this is
  the only spelling that lints.
- **Viewport units** (`vw`/`vh`/`dvh`/`vmin`) only where a box must stay inside the
  viewport whatever its content says. Pick the axis deliberately: `dvh` to cap
  against a short viewport, `vmin` to stay proportional in both orientations. A
  `vmin` cap on a width silently steals width in portrait, where `vmin` _is_ the
  width.

## Breakpoints (ADR-0016)

- **One breakpoint token, `--breakpoint-desktop`** (768px, generated as `48rem`).
  Mobile-first: everything below it is the base, desktop is the `min-width`
  opt-in.
- **A layout that changes _shape_ branches in JS**, through `useIsDesktop()` from
  `src/lib/use-media-query/` — never by rendering both trees and hiding one. Two
  hidden copies of the same form mean duplicate ids, duplicate testids and
  duplicate tab stops. ADR-0016 records the trade-off, including what a runtime
  branch costs.
- **A layout that only changes _looks_ stays in CSS**, with a plain
  `@media (width >= 48rem)`. The literal is unavoidable: a media condition
  cannot read a `var()`. The token is still the source — when it moves, the
  media queries move with it, and `grep` for the value finds them. Range
  notation rather than `min-width:` because Stylelint enforces it; it reads as
  the same mobile-first opt-in.
- Review-guarded, not lint-enforced: no rule can tell a shape change from a
  restyle.

## Motion

- **All durations and easings come from motion tokens** (`--dur-…`, `--ease-…`,
  composed `--transition-…`) — a literal `200ms` in CSS is a lint error.
  JS-orchestrated motion reads the same tokens via `getComputedStyle`; never
  hard-code a duration in TS either.
- `prefers-reduced-motion` is honored at the token layer:
  `src/styles/motion-preferences.css` (hand-authored) collapses duration tokens
  to 1ms, which silences token-reading JS automatically. The global reset's
  blanket kill switch stays as the safety net — don't fight either.
