# Headless UI libraries vs hand-rolling platform primitives

Researched 2026-08-17 against primary sources only (npm registry, GitHub, specs, MDN, caniuse, W3C APG, bundlephobia). Context: React 19 + Vite, CSS Modules + generated tokens, WCAG 2.2 AA hard constraint, tests query by accessible identity.

## Short answer

Hand-roll **Dialog**, **Switch**, **SegmentedControl**, and **Button** on the 2026 platform. Native `<dialog>` + `showModal()` now covers the hard dialog behavior, including spec-mandated focus restore ([HTML spec](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element)). Switch and segmented control are small, well-documented APG patterns.

A library earns its keep on exactly two primitives: **Select** and (less so) **Tooltip**. A WCAG-conformant custom select is a full [APG select-only combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/): typeahead, activedescendant, scroll-into-view, touch + screen-reader combos. The native styling escape hatch, `appearance: base-select`, is still [Chromium-only](https://caniuse.com/mdn-css_properties_appearance_base-select) — not AA-viable cross-browser.

If a library is wanted, **Base UI (`@base-ui/react`)** fits this repo best:

- Clean **React 19** peer range (`^17 || ^18 || ^19`), no rc-range warnings ([npm](https://registry.npmjs.org/@base-ui/react/latest)).
- **Subpath imports** (`@base-ui/react/select`) hard-bound per-primitive cost; `sideEffects: false`.
- Styling via **`className` + data attributes** (`data-popup-open`, `data-selected`) — ideal for CSS Modules, [zero lock-in](https://base-ui.com/react/handbook/styling).
- **MUI-staffed**, v1.0 stable since Dec 2025, monthly releases through Aug 2026 ([releases](https://github.com/mui/base-ui/releases)).

**Radix** is the credible runner-up: per-primitive npm packages, active WorkOS maintenance (verified — the "abandoned" rumor is stale). **React Aria Components** has the deepest accessibility (mobile screen readers, i18n) but the heaviest, least tree-shake-safe packaging. **Ariakit** is excellent but 0.x, one-person-funded, and lacks Switch and ToggleGroup.

## Library comparison

| Axis                    | React Aria Components                                                                                                                  | Radix Primitives                                                                  | Base UI                                                          | Ariakit                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------- |
| Version (Aug 2026)      | 1.20.0 (2026-07-31)                                                                                                                    | dialog 1.1.23, select 2.3.7                                                       | 1.7.0 (2026-08-04)                                               | 0.4.37 (2026-08-09)                                 |
| React 19 peer dep       | `^19.0.0-rc.1` (works; [warning noise #9267](https://github.com/adobe/react-spectrum/issues/9267))                                     | `^19.0 \|\| ^19.0.0-rc`                                                           | `^17 \|\| ^18 \|\| ^19`                                          | `^17 \|\| ^18 \|\| ^19`                             |
| Styling for CSS Modules | `className` (string or state fn), `data-hovered`/`data-selected` etc.                                                                  | `className` passthrough, `data-state`                                             | `className` (string or state fn), rich data attrs, `render` prop | `className`, `render` prop, `data-active-item` etc. |
| Per-primitive isolation | Weak — one entry, tree-shaking-dependent; [RFC](https://github.com/adobe/react-spectrum/blob/main/rfcs/2025-dependencies.md) fixing it | Strong — one npm package per primitive; subpath entries added Jul 2026            | Strong — subpath exports per component                           | Strong — subpath exports per component              |
| Dialog cost (gzip)      | ~5.3 kB Dialog + ~16.8 kB Modal¹                                                                                                       | 12.9 kB ([bundlephobia](https://bundlephobia.com/package/@radix-ui/react-dialog)) | not independently measured²                                      | ~16.0 kB¹                                           |
| Select cost (gzip)      | ~29.5 kB¹                                                                                                                              | 29.5 kB ([bundlephobia](https://bundlephobia.com/package/@radix-ui/react-select)) | not independently measured²                                      | ~10.3 kB¹ (excl. popover chunk)                     |
| Switch cost (gzip)      | ~13.7 kB¹                                                                                                                              | 4.5 kB                                                                            | small²                                                           | none (no Switch)                                    |
| Whole-package gzip      | 271.5 kB                                                                                                                               | n/a (per-package)                                                                 | 145 kB (35 components)                                           | 62.3 kB                                             |
| `sideEffects`           | `"*.css"`                                                                                                                              | `false`                                                                           | `false`                                                          | `false`                                             |
| Backing                 | Adobe                                                                                                                                  | WorkOS                                                                            | MUI                                                              | Diego Haz (individual) + Ariakit Plus               |
| Repo pulse (Aug 2026)   | releases ~monthly                                                                                                                      | commits 2026-07-31; ~monthly releases                                             | pushed 2026-08-17; 407 open issues                               | pushed 2026-08-17; 39 open issues                   |

¹ [Bundlephobia exports-sizes](https://bundlephobia.com/api/exports-sizes?package=react-aria-components) measures each export in isolation. Shared runtime is counted in every number; combined imports dedupe. bundlejs.com was unreachable during this research, so treat these as upper bounds per first import.

² Bundlephobia's export analysis returned no data for `@base-ui/react`. Subpath imports plus `sideEffects: false` bound the cost structurally; measure in-app with `vite-bundle-visualizer` before committing.

### React Aria Components (Adobe)

**A11y**: the deepest coverage. Adobe claims components are ["extensively tested using many popular screen readers and devices"](https://react-aria.adobe.com/), with touch screen-reader support and mobile-specific affordances (hidden dismiss buttons in dialogs). Select ships typeahead, form integration, and full listbox semantics ([docs](https://react-aria.adobe.com/Select)); Modal ships focus containment, restore, scroll lock, and background hiding from AT ([docs](https://react-aria.adobe.com/Modal)). [ToggleButtonGroup](https://react-aria.adobe.com/ToggleButtonGroup) has a documented segmented-control example.

**Cost is the catch**. One entry point, ~200 transitive workspace packages, tree-shaking-dependent; users report a Button pulling ~175 kB in bad setups ([#5639](https://github.com/adobe/react-spectrum/issues/5639)). Adobe's own [dependencies RFC](https://github.com/adobe/react-spectrum/blob/main/rfcs/2025-dependencies.md) admits: "Some bundlers and testing environments don't tree shake in development, resulting in long build times." Vite production builds do tree-shake, but a single Select still lands ~30 kB gzip of shared runtime.

**React 19**: works; peer range still `^19.0.0-rc.1`, causing pnpm warnings ([#9267](https://github.com/adobe/react-spectrum/issues/9267)). Also note `sideEffects: "*.css"` (it ships some CSS).

### Radix Primitives (WorkOS)

**Maintenance verified, not rumor**: commits on 2026-07-31, ~monthly releases through July 2026, two new primitives in 2025 (OneTimePasswordField, PasswordToggleField), and React 19 compat work in the 2026-06-30 release ([changelog](https://www.radix-ui.com/primitives/docs/overview/releases)). Repo says "Maintained by @workos" ([GitHub](https://github.com/radix-ui/primitives)). The 2023–24 slowdown was real; the current cadence is healthy. 196 open issues, 141 open PRs.

**A11y**: Dialog traps focus, restores on Esc/close, and wires `Title`/`Description` announcements ([docs](https://www.radix-ui.com/primitives/docs/components/dialog)). Select follows the listbox pattern with typeahead and renders a hidden native `<select>` for forms ([docs](https://www.radix-ui.com/primitives/docs/components/select)). ToggleGroup implements roving tabindex per APG ([docs](https://www.radix-ui.com/primitives/docs/components/toggle-group)).

**Gaps**: Tooltip deliberately never opens on touch — a long-standing by-design decision ([#1573](https://github.com/radix-ui/primitives/issues/1573), [discussion #2866](https://github.com/radix-ui/primitives/discussions/2866)). Fine for supplementary info; plan a toggletip where content matters. Per-primitive packages give the best measured isolation of the four (dialog 12.9 kB, switch 4.5 kB gzip).

### Base UI (`@base-ui/react`, MUI)

Built by "the creators of Radix, Floating UI, and Material UI" ([repo](https://github.com/mui/base-ui)). v1.0 shipped Dec 2025 with 35 components ([InfoQ](https://www.infoq.com/news/2026/02/baseui-v1-accessible/)); v1.7.0 on 2026-08-04. Note the rename: **`@base-ui-components/react` is deprecated** in favor of `@base-ui/react` ([npm](https://registry.npmjs.org/@base-ui-components/react/latest)).

**A11y**: Dialog covers focus trap, initial/final focus, scroll lock, nested dialogs, and touch-aware initial focus ([docs](https://base-ui.com/react/components/dialog)). Select ships typeahead, hidden-input form integration, touch-specific positioning, and native-select alignment (`alignItemWithTrigger`) ([docs](https://base-ui.com/react/components/select)). Tooltip is hoverable by default and documents why it disables on touch ([docs](https://base-ui.com/react/components/tooltip)).

**Fit here**: `className` accepts a state function; every part exposes data attributes (`data-open`, `data-highlighted`, `data-starting-style` for animation). Docs state compatibility with "Tailwind, CSS Modules, CSS-in-JS, or any other styling solution" ([styling handbook](https://base-ui.com/react/handbook/styling)). Watch item: 407 open issues reflect a young, fast-moving v1.

### Ariakit

One core maintainer (**Diego Haz**), funded by [Ariakit Plus](https://newsletter.ariakit.org/p/ariakit-plus) subscriptions and [Open Collective](https://opencollective.com/ariakit). Very active (pushed 2026-08-17, 39 open issues) but **still 0.4.x** — no stable-major API promise. React 19 peer range is clean.

**A11y**: Select follows the [combobox pattern](https://ariakit.com/components/select); Dialog is a long-standing strength (modal and non-modal, portal-aware). **Component gaps for this list**: no Switch, no ToggleGroup/segmented control ([components index](https://ariakit.com/components)) — you'd compose Checkbox/Radio/Toolbar yourself. Tooltip is its heaviest relevant export (~26 kB gzip isolated).

## Hand-rolled per primitive (2026 platform)

### Dialog — hand-roll it

Free with `<dialog>` + `showModal()` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal), [spec](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element)):

- **Top layer** rendering + styleable `::backdrop`.
- **Inert background** — everything outside becomes inert, which is a true focus trap plus AT-hiding.
- **Esc to close** (`cancel` event), correct stacking for nested modals.
- **`aria-modal="true"`** implicit.
- **Focus restore on close** — the spec stores the previously focused element and reruns focusing steps on close.

Still manual:

- **Scroll lock**: inert blocks interaction, but the document scrollbar behind the backdrop still works. Set `overflow: hidden` on `html` while open (one `useEffect`).
- **Initial focus**: browser picks the first focusable; MDN recommends explicit [`autofocus`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) on the intended target.
- **Focus-restore edge case**: spec restores to the stored element; if you removed the trigger while open, pick a fallback yourself.
- **Light dismiss**: [`closedby="any"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) is newer with uneven support — wire backdrop-click yourself for now.
- Exit animations and React open-state wiring (`@starting-style` helps).

### Tooltip — hand-rollable; the manual part is interaction logic, not positioning

Platform status:

- **Popover API**: Baseline, newly available since Jan 2025; gives top layer, light dismiss, Esc ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)).
- **CSS anchor positioning**: Chrome/Edge 125+, Safari 26+, Firefox 147+ — all evergreen engines as of 2026, but ~84% global support ([caniuse](https://caniuse.com/css-anchor-positioning)). Fallback in old browsers is an unpositioned popover; decide if that's acceptable.

Stays manual, and is the real work:

- **Trigger wiring**: open on hover _and_ focus, close on blur/leave; `aria-describedby` from trigger to tooltip; `role="tooltip"`.
- **[WCAG 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)**: dismissible (Esc without moving focus), hoverable (pointer can cross onto the tooltip), persistent.
- Show/hide **delays**, skip-delay across adjacent tooltips, hover-intent geometry.
- **Touch policy**: hover doesn't exist; either suppress (Radix/Base UI approach) or design a toggletip.

For this game's likely needs (icon-button labels), a hand-rolled popover-based tooltip is fine. If tooltip count grows, this is the second-best library candidate after Select.

### Switch — hand-roll, near-free

The [APG switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/) is a leaf widget: `<button role="switch" aria-checked>`, toggle on Space (Enter optional), stable accessible name. No focus management, no collections. A native checkbox variant works too; `role="switch"` on a button gives the cleaner announcement.

Total cost: one component, one click handler, CSS on `[aria-checked='true']`. Tests query `getByRole('switch', { name })` directly.

### SegmentedControl — hand-roll as a radio group

APG has no segmented-control pattern; single-choice semantics map to [radiogroup](https://www.w3.org/WAI/ARIA/apg/patterns/radio/): roving tabindex, arrows move-and-select with wrap, group label. Two free-ish routes:

- **Native `<input type="radio">`** visually hidden, styled labels — the browser supplies roving tabindex and arrow keys for zero JS. Best option here.
- Custom `role="radiogroup"` + a ~40-line roving-tabindex hook if button semantics are needed.

Library note: Radix/Base UI ToggleGroups announce as **toggle buttons**, not radios; RAC's ToggleButtonGroup documents an explicit segmented-control recipe. Semantically the radio route is the most honest for exclusive choice.

### Select — the one real library case

A conformant custom select is the [APG select-only combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/), in full:

- `role="combobox"` trigger with `aria-expanded`, `aria-controls`, `aria-activedescendant`; popup `listbox`/`option` with `aria-selected`.
- Open via Down/Up/Enter/Space/Home/End; inside: arrows (no wrap), Home/End, PageUp/PageDown (±10), Enter/Space/Tab select, Esc cancels, Alt+Up selects-and-closes.
- **Typeahead** on printable characters, cycling on repeats — closed _and_ open.
- Manual `scrollIntoView` for the active option (activedescendant moves no real focus).
- Positioning, dismissal, form value, autofill, plus touch and mobile screen-reader verification.

Platform escape hatches:

- **Customizable `<select>`** (`appearance: base-select`, `<selectedcontent>`): Chrome/Edge 135+ only; Safari 27 in Technology Preview; Firefox disabled ([caniuse](https://caniuse.com/mdn-css_properties_appearance_base-select), [MDN guide](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select)). Not usable under an AA constraint in 2026; degrades to a classic select, so fine as progressive enhancement.
- **Plain native `<select>` lightly styled** — fully viable and the most accessible option. The closed trigger styles freely (font, border, background, custom arrow); only the open picker keeps OS styling. For a game's settings panel, seriously consider this before any library.

If design demands a styled popup: take **Base UI Select** (or Radix Select). Do not hand-roll this one.

### Button / IconButton — nothing to buy

Native `<button>` has no behavioral gaps. Edge cases in full:

- **Icon-only needs an accessible name** — `aria-label` or visually hidden text (WCAG 4.1.2 / tests-by-name).
- Don't override `type` semantics inside forms; keep visible focus (WCAG 2.4.7 / 2.4.11).

Libraries add hover/press normalization conveniences (e.g. RAC's `data-pressed`), not conformance. CSS `:hover`/`:active`/`:focus-visible` suffice.

## What a library actually buys, condensed

- **Select and Tooltip interaction depth** — typeahead, activedescendant, delay grouping, touch/SR handling you would otherwise write and test manually.
- **Tested AT behavior** — Adobe explicitly tests across screen readers; the others encode years of issue-report fixes.
- **Real roles and names for free** — all four render proper semantics, so `getByRole` queries in RTL work identically to hand-rolled markup.
- **Not** dialog focus management (platform-native now), not switches, not buttons, not radio-style segmented controls.

## Sources

- npm registry: [react-aria-components](https://registry.npmjs.org/react-aria-components/latest) · [@radix-ui/react-dialog](https://registry.npmjs.org/@radix-ui/react-dialog/latest) · [@base-ui/react](https://registry.npmjs.org/@base-ui/react/latest) · [@base-ui-components/react (deprecated)](https://registry.npmjs.org/@base-ui-components/react/latest) · [@ariakit/react](https://registry.npmjs.org/@ariakit/react/latest)
- Bundlephobia: [react-aria-components](https://bundlephobia.com/package/react-aria-components) · [@radix-ui/react-dialog](https://bundlephobia.com/package/@radix-ui/react-dialog) · [@radix-ui/react-select](https://bundlephobia.com/package/@radix-ui/react-select) · [@radix-ui/react-switch](https://bundlephobia.com/package/@radix-ui/react-switch) · [@radix-ui/react-tooltip](https://bundlephobia.com/package/@radix-ui/react-tooltip) · [@radix-ui/react-toggle-group](https://bundlephobia.com/package/@radix-ui/react-toggle-group) · [@base-ui/react](https://bundlephobia.com/package/@base-ui/react) · [@ariakit/react](https://bundlephobia.com/package/@ariakit/react) · exports-sizes API for per-export numbers
- GitHub: [adobe/react-spectrum releases](https://github.com/adobe/react-spectrum/releases) · [dependencies RFC](https://github.com/adobe/react-spectrum/blob/main/rfcs/2025-dependencies.md) · [#5639](https://github.com/adobe/react-spectrum/issues/5639) · [#9267](https://github.com/adobe/react-spectrum/issues/9267) · [radix-ui/primitives](https://github.com/radix-ui/primitives) · [Radix changelog](https://www.radix-ui.com/primitives/docs/overview/releases) · [Radix tooltip touch #1573](https://github.com/radix-ui/primitives/issues/1573) · [mui/base-ui](https://github.com/mui/base-ui) · [Base UI releases](https://github.com/mui/base-ui/releases) · [ariakit/ariakit](https://github.com/ariakit/ariakit)
- Docs: [React Aria styling](https://react-aria.adobe.com/styling) · [Select](https://react-aria.adobe.com/Select) · [Modal](https://react-aria.adobe.com/Modal) · [ToggleButtonGroup](https://react-aria.adobe.com/ToggleButtonGroup) · [Radix styling](https://www.radix-ui.com/primitives/docs/guides/styling) · [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog) · [Radix Select](https://www.radix-ui.com/primitives/docs/components/select) · [Radix Toggle Group](https://www.radix-ui.com/primitives/docs/components/toggle-group) · [Base UI styling](https://base-ui.com/react/handbook/styling) · [Base UI Dialog](https://base-ui.com/react/components/dialog) · [Base UI Select](https://base-ui.com/react/components/select) · [Base UI Tooltip](https://base-ui.com/react/components/tooltip) · [Base UI Toggle Group](https://base-ui.com/react/components/toggle-group) · [Ariakit components](https://ariakit.com/components) · [Ariakit Select](https://ariakit.com/components/select)
- Platform: [HTML spec `<dialog>`](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element) · [MDN `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) · [MDN showModal()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal) · [MDN Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) · [caniuse anchor positioning](https://caniuse.com/css-anchor-positioning) · [caniuse base-select](https://caniuse.com/mdn-css_properties_appearance_base-select) · [MDN customizable select](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select)
- APG / WCAG: [Switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/) · [Radio pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) · [Select-only combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/) · [Understanding 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)
- Funding/backing: [Ariakit Plus](https://newsletter.ariakit.org/p/ariakit-plus) · [Ariakit Open Collective](https://opencollective.com/ariakit) · [Base UI v1 coverage (InfoQ)](https://www.infoq.com/news/2026/02/baseui-v1-accessible/)
