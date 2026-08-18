# Design tokens have two source tiers: Figma-exported and hand-maintained

`tokens/` splits into two tiers, both DTCG JSON feeding one Style Dictionary
build and one generated `tokens.css`:

- **`tokens/figma/`** — exported from Figma by the **TokensBrücke** plugin.
  Replaced wholesale on every export; never hand-edited.
- **`tokens/manual/`** — hand-owned values Figma cannot hold: material
  gradient stacks, glass/backdrop-filter values, motion easings, composed
  `transition`/`font` shorthands. The design prototype's CSS is their
  reference.

CSS variable names mirror the Figma variable paths exactly (`space/3` →
`--space-3`, `text/strong` → `--text-strong`) — no added category prefixes.

Recorded because "Figma is the source of truth" (ADR-0006) turned out to have a
hard boundary: Figma variables hold only color/number/string/boolean, and
styles add typography/shadow/gradient composites — but the design's wood and
glass materials are stacked `repeating-linear-gradient` strings, and its
composed transitions are CSS-specific. Pretending Figma holds those would mean
inventing fake variables; pretending the repo owns everything would reintroduce
hand-copied drift for the 90% Figma does hold.

## Why TokensBrücke

A plugin is unavoidable: Figma has no variable-export UI, and the REST API is
Enterprise-only (ADR-0006). TokensBrücke is the only surveyed free plugin that
meets all three requirements (see `docs/research/figma-token-export.md`):
DTCG `$value`/`$type` output (Style Dictionary parses it natively), **aliases
preserved** as `{dot.path}` references (variables2json flattens them, which
destroys the base → semantic layering), and style export (typography, shadows,
gradients). Popularity risk is accepted: the plugin is a one-click exporter,
not infrastructure — the committed JSON outlives it, and any future DTCG
exporter can replace it with only a conventions edit.

## Considered options

- **Everything exported, materials as fake string variables in Figma.**
  Rejected: designers would maintain CSS strings in Figma fields they cannot
  preview — worse drift than the split.
- **Everything hand-maintained.** Rejected by ADR-0006 already; the export
  exists to prevent hand-copied drift.
- **Category-prefixed CSS names (`--color-text-strong`).** Rejected: the
  design system's components and docs speak the flat names; mirroring makes
  prototype CSS portable 1:1 and keeps one vocabulary across design and code.

## Consequences

- ADR-0006's "the first export replaces `tokens/*.json` wholesale" now scopes
  to `tokens/figma/` only.
- The `text/*` size group is renamed `font-size/*` in Figma before the first
  export so sizes and semantic text colors cannot collide (SLI-16).
- Style Dictionary needs ≥ 5.4.0 for TokensBrücke's DTCG-2025.10 dimension
  objects (package.json pins `^5.5.1` since the cutover, SLI-17).
- `prefers-reduced-motion` collapses duration tokens in a small hand-authored
  `src/styles/motion-preferences.css` — JSON cannot express media queries. JS
  that orchestrates motion reads durations from tokens (`getComputedStyle`),
  so the collapse silences it too; the global reset stays as the blunt safety
  net.
- The CI drift gate (`pnpm tokens && git diff --exit-code`) already exists and
  covers both tiers.

**Amended (first export, SLI-17):** the manual tier turned out smaller than
planned. Easings fit in Figma after all — string variables holding
`cubic-bezier(…)` — and composed `font` shorthands generate from the export's
Typography styles, so the manual tier holds only the material stacks (plus
glass extras) and the composed `transition` shorthands. Manual `material/*`
entries override the export's same-named gradient styles, which lose their
angles in DTCG.
