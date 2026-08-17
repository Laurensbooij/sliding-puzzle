# Interactive primitives are hand-rolled on the platform, not a UI library

The design system's interactive primitives — Dialog, Select, Switch,
SegmentedControl, Tooltip — carry **zero runtime UI dependencies**. Each builds
on the native element or platform API that implements its accessibility
contract:

- **Dialog** — `<dialog>` + `showModal()`: focus trap, inert background, Esc,
  and spec-mandated focus restore are native. We add scroll-lock and initial
  focus.
- **Select** — a styled native `<select>`; the design itself specifies "native
  select with Slider Puzzle chrome", so no custom listbox exists to build.
- **Switch** — native checkbox with `role="switch"`.
- **SegmentedControl** — visually-hidden native radios; the browser provides
  the roving-tabindex keyboard model.
- **Tooltip** — popover API (top layer) + CSS anchor positioning; the
  WCAG 1.4.13 hover behaviors (hoverable, dismissible) are hand-written.

The only design-driven packages are **`lucide-react`** (the icon set _is_
stock Lucide; typed names power the `Icon` union, tree-shaking bundles only
used glyphs) and **`@fontsource` font packages** (ADR-0010). **No animation
library** — designed motion is CSS transitions/keyframes over motion tokens.

Recorded because "add Radix/Base UI" is the default reflex for exactly these
five components, and the 2026 platform quietly removed the reason: headless
libraries package focus/keyboard/announcement logic browsers now ship
natively. What remains hand-written is small and well-specified; a library
would add a dependency surface, bundle weight, and an API between us and the
DOM to avoid work that no longer exists. WCAG 2.2 AA is met by the platform
behaviors plus the gates from the a11y verification strategy.

## When to revisit

Adopt a UI library only when **both** hold:

1. A design calls for a control whose ARIA Authoring Practices pattern is
   genuinely large (custom-styled open listbox, filtering combobox, date
   picker — hundreds of lines of focus/keyboard/announcement logic), **and**
2. no native element or platform API implements that pattern.

Which library is **deliberately not pre-decided** — evaluate against the
then-current landscape when the need is real.
`docs/research/headless-ui-libraries.md` (research branch) is the starting
point, not the answer.

## Considered options

- **Adopt a headless library now** (Base UI, Radix, React Aria, Ariakit —
  compared in the research doc). Rejected: every needed primitive has a cheap
  platform path, and the design's Select is native by specification, which
  removes the one component where a library demonstrably pays.
- **Vendored icon SVGs instead of `lucide-react`.** Rejected while the set is
  stock Lucide: the package gives typed names and upstream fixes. A glyph gets
  vendored into the repo only if it ever diverges from stock.
