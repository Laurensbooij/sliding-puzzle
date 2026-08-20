# Module boundaries are named aliases, enforced in one direction

Code flows one way — `engine → lib → {machines | components} → widgets →
features → app` — features never import one another, widgets never import one
another, and machines and components never import each other. Nine modules carry
a named import alias (`@engine`, `@i18n`, `@messages`, `@testing`, `@css-utils`,
`@game-config`, `@records`, `@settings`, `@source-images`), plus the glob aliases
`@components/*`, `@machines/*` and `@widgets/*`; everything else uses `@/*`. An
aliased module may **only** be reached through its alias; the long `@/...`
spelling is a lint error, and for the two glob tiers so is anything deeper than
the barrel.

Recorded because the alias set looks arbitrary without its rule, and because a
reader will otherwise add `@features` or `@components` and quietly undo the
boundary.

## The rule for adding an alias

A named alias means **"this is a stable module with a public API you may depend
on"**. That is why `@features` does not exist: cross-feature imports are banned,
so making them ergonomic would work against the boundary.

**Amended (design-system implementation):** this ADR originally withheld
`@components` "while the shared tier is empty — an alias to an empty folder is
an invitation to fill it". That condition ended when the Figma design system
made the shared tier's contents a design fact rather than a speculation;
[ADR-0009](./0009-design-system-components-are-born-shared.md) records the
decision and adds `@components/*` as a glob alias (per-component modules, no
tree barrel).

**Amended (machines tier):** `@machines/*` joins on the same shape —
per-machine modules, no tree barrel;
[ADR-0012](./0012-state-machines-are-born-shared.md) records the decision and
the machines/components sibling rule.

**Amended (widgets tier):** `@widgets/*` joins on the same shape as
`@components/*` and `@machines/*` — per-widget modules with an `index.ts` barrel
each, no tree barrel. The barrel is also the whole public API: anything deeper
than `@widgets/<Name>` is a lint error, because a widget nests its
single-consumer sub-components directly beside it rather than under a
`components/` segment, which would otherwise leave them as importable as the
widget itself. The tier sits between components and features:
`engine → lib → {machines | components} → widgets → features → app`. A widget may
import `@components/*`, `@css-utils`, `@i18n`, `src/lib/` and react-router; it may
not import a feature, another widget, or `@machines/*` — logic and presentation
meet in features (ADR-0012), so a widget holds local UI state but never an actor.
[ADR-0009](./0009-design-system-components-are-born-shared.md) records what the
tier is for.

Note the asymmetry with `@features`, which deliberately does not exist: both tiers
ban sideways imports, so neither gets a barrel to alias to. `@widgets/*` still
earns its glob alias because the tier is imported _forward_ by every feature —
`@features` would only ever have served the imports the boundary forbids.

**Amended (CSS helpers):** `@css-utils` joins as a named alias for
`src/lib/css-utils/`. It qualifies on the rule above — every component that
composes class names depends on it, and its API is one function
([SLI-36](https://linear.app/sliding-puzzle/issue/SLI-36)).

**Amended (state homes and source images):** four named aliases join —
`@game-config`, `@records`, `@settings` and `@source-images`. Each clears the
rule above: a barrel with a public API that consumers across tiers depend on.
The three state homes stay three flat aliases rather than one `@state/*` glob —
a glob needs them collected under `src/lib/state/`, which is visibly the
grouping [ADR-0015](./0015-state-homes-are-modular.md) rejected.

`storage` is deliberately excluded. Five of its six imports are the three state
providers themselves. It is the building block the state homes are made of, not
a module features depend on, and an alias would invite a feature to persist
state directly instead of through a state home.

**Amended (the components barrel is a boundary):** `@components/*/*` joins the
ban that already covers `@widgets/*/*` — a shared component's barrel is its
whole public API, same as a widget's. `import-x/no-cycle` is enabled alongside
it: barrel-to-barrel imports inside one tier are legal and correct (`Dialog`
imports `@components/Modal`), which is exactly the shape a cycle would take.
Both landed with zero violations to fix.

## Considered options

- **One `@/*` alias only.** Simpler, and it was the original decision. Rejected:
  the highest-traffic modules deserve an import specifier that does not change
  when the folder moves, and `@i18n` in particular reinforces the facade —
  nobody types a path that looks like a library wrapper.
- **Node subpath imports (`#messages`).** More standards-correct and needs no
  bundler config at all. Rejected: mixing `#`- and `@/`-prefixed specifiers reads
  as two systems in one repo.

## Consequences

- Aliases are declared once in `tsconfig.app.json`. Vite, Vitest and Storybook
  read them through Vite's native `resolve.tsconfigPaths`, so there is no second
  declaration to drift.
- The cross-feature and cross-widget zones are generated by reading
  `src/features/` and `src/widgets/` at lint-config load, so adding a feature or a
  widget needs no config edit.
- `import-x/no-restricted-paths` **requires a TypeScript resolver**. Without one
  it cannot turn an extensionless or aliased specifier into a path, and silently
  matches nothing — a configured, enabled rule that catches zero violations.
- `import-x/no-cycle` needs **`settings['import-x/extensions']`** to list `.ts`
  and `.tsx` on top of that resolver. import-x only builds an export map for the
  extensions named there and the default list is JS-only, so without it the rule
  passes every TypeScript file without reading it — the same silent-zero failure
  one level down, and one that looks like a clean repo.
