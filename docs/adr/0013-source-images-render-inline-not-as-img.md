# Source images render inline, coloured by the consumer

A Tile shows its fragment with an inline `<svg>` component from the registry —
`import Bike from './vectors/bike.svg?react'`, transformed by
`vite-plugin-svgr` — not with an `<img>`. The SVG files keep
`stroke="currentColor"`; the ink comes from whoever renders them, as
`color: var(--art-ink)`.

Recorded because it reverses this repo's own written rule. The **Source
images** convention used to mandate "a full-board `<img alt=""
draggable="false">` … one cached asset serves every tile", and that rule
cannot produce a coloured image. An `<img>` renders its SVG in a separate
document with no CSS inheritance, so `currentColor` resolves against the
image's own initial colour — black — and no consumer, token, or attribute can
reach in. The six source images are `currentColor` line art, so under the old
rule every tile drew a black icon on the glass.

The caching argument the old rule rested on had also quietly stopped applying:
at 306–485 bytes each, every source image is under Vite's
`assetsInlineLimit` and ships as a `data:` URI inside the JS bundle, not as a
hashed file the browser caches.

## Considered options

- **Bake the ink into the SVG files.** Rejected: the colour then wins over the
  consumer's, and the design system ships _two_ ink tokens (`art/ink`,
  `art/ink-alt`) — a baked file can never carry a two-tone treatment.
- **CSS `mask-image` + `background-color: var(--art-ink)`.** Works, and keeps
  the registry a map of URLs. Rejected: a mask is a single alpha channel, so
  it caps the art at one colour permanently, for no gain over inlining files
  this small.
- **A `filter` chain over the `<img>`.** Rejected: not expressible from a
  colour token, and unreadable.

## Consequences

- The registry's value type changes from `Record<SourceImageName, string>` to
  `Record<SourceImageName, FC<SVGProps<SVGSVGElement>>>`. Consumers render the
  entry; they no longer hold a URL.
- `vite-plugin-svgr` joins the build. It is a build-time transform, not a
  runtime UI or design package, so ADR-0011 does not bar it — but Vitest
  projects do not inherit the root Vite config, so the plugin is named in
  `vite.config.ts` **and** in each project in `vitest.config.ts`.
- The fragment geometry is unchanged: the inline `<svg>` is still sized
  `cols × 100%` by `rows × 100%` and offset by the tile's home-cell
  percentages, with `preserveAspectRatio="none"` to stretch rather than
  letterbox on a non-square board. Still no build-time slicing.
- The markup repeats per tile rather than being one shared asset — ~400 bytes
  × the tile count. Accepted at these sizes; revisit if source images ever
  become detailed artwork rather than line art.
- Source images are decorative: the inline `<svg>` carries `aria-hidden`,
  where the `<img>` carried `alt=""`.
