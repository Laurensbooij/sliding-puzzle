# Figma variable-export plugins × Style Dictionary

**Job-to-be-done**: pick a free, manual-click Figma plugin. It must export tokens
as JSON into `tokens/`, land close to our existing **DTCG** files, and feed
**Style Dictionary v5** unchanged. No REST API — the account is not Enterprise
([Variables REST API is Enterprise-only](https://developers.figma.com/docs/rest-api/variables/)).

## Recommendation

Use **[TokensBrücke](https://github.com/tokens-bruecke/figma-plugin)**.

- **Free**, MIT, open source. Active: last push 2026-07, 0 open issues
  ([repo](https://github.com/tokens-bruecke/figma-plugin)).
- Outputs **DTCG** `$value`/`$type` JSON — the same shape as `tokens/base.json`
  ([README](https://github.com/tokens-bruecke/figma-plugin#readme)).
- Preserves **aliases** as `{colors.primary.10}` references — required, because
  `tokens/semantic.json` is built on aliases
  ([README](https://github.com/tokens-bruecke/figma-plugin#readme)).
- Also exports **styles**: typography composites, shadow/blur effects, gradients.
  That covers the categories Figma variables cannot hold (see below).

Two caveats:

- Its default "**DTCG 2025.10**" toggle emits dimensions as `{ "value": 6, "unit": "px" }`
  objects. Style Dictionary supports that only from **v5.4.0**
  ([releases](https://github.com/style-dictionary/style-dictionary/releases)).
  The repo pins `^5.1.0` — run `pnpm update style-dictionary` (stays in-range), or
  switch the toggle off for string dimensions.
- Multi-mode values land under `$extensions.mode` (non-spec) or in split per-mode
  files. Irrelevant today: single theme, single mode.

**Runner-up**: Figma's own
[variables-import-export sample plugin](https://github.com/figma/plugin-samples) —
tiny, DTCG-shaped, aliases preserved. Rejected: it exports **color and number
variables only**; no strings, no styles
([code](https://github.com/figma/plugin-samples/blob/master/variables-import-export/code.js)).

## Comparison table

| Plugin                                                                                                               | Cost                                                                                                       | Format                                                                                                                                                                | Collections/modes                                                                                                          | Aliases                                                                                                                                | Styles too?                                                 | Maintenance                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **[TokensBrücke](https://github.com/tokens-bruecke/figma-plugin)**                                                   | Free (MIT)                                                                                                 | DTCG `$value`/`$type`, 2025.10 toggle                                                                                                                                 | Collection = root group; modes in `$extensions.mode` or split files                                                        | **Preserved** as `{dot.path}`                                                                                                          | **Yes**: typography, shadow, blur, gradient, grid           | Push 2026-07, 0 issues                                                                                                         |
| [variables2json](https://github.com/mark-nicepants/variables2json-docs)                                              | Free                                                                                                       | **Custom**: `collections[] → modes[] → variables[]`, bare `name/type/value`                                                                                           | Explicit arrays per collection and mode                                                                                    | "automatically resolved" — flattened to raw values ([docs](https://github.com/mark-nicepants/variables2json-docs/blob/main/README.md)) | Yes: typography, effects, grids                             | Docs repo last push 2023-07, 12 issues; plugin update cadence **unverified** (community page blocks fetch)                     |
| [Design Tokens](https://github.com/lukasoppermann/design-tokens) (Oppermann)                                         | Free (MIT)                                                                                                 | "Standard (W3C draft)" but **unprefixed** `value`/`type` ([source](https://github.com/lukasoppermann/design-tokens/blob/main/src/transformer/standardTransformer.ts)) | Variables exported "as generic tokens"; mode names optionally baked into names/values                                      | Only via manual `ref: core-colors.red` text in style descriptions                                                                      | Yes: color/text/grid/effect styles + `_tokens` frames       | Push 2026-02, 41 issues; author: "only partially supported" ([README](https://github.com/lukasoppermann/design-tokens#readme)) |
| [Tokens Studio](https://docs.tokens.studio/)                                                                         | Plugin free; **modes/themes need paid Pro** ([themes doc](https://docs.tokens.studio/figma/export/themes)) | Own JSON; **opt-in DTCG** `$value`/`$type` ([changelog 2.0](https://feedback.tokens.studio/changelog/release-20))                                                     | Free tier: 1 collection per token set, **no modes** ([token-sets doc](https://docs.tokens.studio/figma/export/token-sets)) | Preserved (its own reference syntax)                                                                                                   | Yes — but tokens live in the plugin, not in Figma variables | Actively developed (company product)                                                                                           |
| Figma [sample plugin](https://github.com/figma/plugin-samples) (first-party)                                         | Free (sample code)                                                                                         | DTCG `$type`/`$value`, file per `collection.mode.tokens.json`                                                                                                         | One file per collection+mode                                                                                               | **Preserved** as `{dot.path}`                                                                                                          | No — **color + FLOAT variables only**                       | Sample, not a product                                                                                                          |
| [Token Press](https://www.figma.com/community/plugin/1560757977662930693/token-press-dtcg-style-dictionary-exporter) | Listing says DTCG export of variables + text/effect styles                                                 | DTCG (claimed)                                                                                                                                                        | **unverified**                                                                                                             | **unverified**                                                                                                                         | Claimed yes                                                 | **unverified** — community page returns 403 to fetchers; no public repo found                                                  |

Figma ships **no native JSON-export UI** for variables. Its official paths are the
Enterprise-only [REST API](https://developers.figma.com/docs/rest-api/variables/)
and the open-source [sample plugin](https://github.com/figma/plugin-samples).

## Per-plugin details

### TokensBrücke

- **Source**: [tokens-bruecke/figma-plugin](https://github.com/tokens-bruecke/figma-plugin), MIT.
- **Variables**: all four Figma variable types (COLOR, FLOAT, STRING, BOOLEAN).
- **Styles**: typography → DTCG `typography` composite; effects → `shadow`
  (arrays + `inset`) and blur; paint styles → `gradient` composite with color
  refs per stop. Style export is a toggle.
- **Options**: color format (hex, rgba, hsla, OKLCH), split by collection/mode,
  scopes in `$extensions`, named export profiles.
- **Aliases**: emitted as `{group.token}` — matches our existing files.
- **Timing/easing variables**: README lists only the four classic types.
  Export of Figma's newer `timing`/`easing` variable types is **unverified**.

### variables2json

- **Source of truth**: only a [docs repo](https://github.com/mark-nicepants/variables2json-docs);
  plugin code is not public.
- **Shape**: proprietary — `{ version, metadata, collections: [{ name, modes: [{ name, variables: [{ name, type, value }] }] }] }`.
- **Aliases**: docs say color/number/string/boolean "aliasses are automatically
  resolved" — references are flattened. That destroys our base → semantic layering.
- **Fit**: needs a fully custom Style Dictionary parser; disqualified by alias
  flattening alone.

### Design Tokens (Lukas Oppermann)

- **Format**: early W3C draft, `value`/`type` **without** `$` prefixes
  ([standardTransformer.ts](https://github.com/lukasoppermann/design-tokens/blob/main/src/transformer/standardTransformer.ts)).
  Style Dictionary auto-detects DTCG per build
  ([`usesDtcg`](https://styledictionary.com/reference/config/)); mixing prefixed
  and unprefixed files in one build invites trouble.
- **Aliases**: only through hand-typed `ref:` annotations in Figma style
  descriptions — high designer friction.
- **Status**: author declares it "only partially supported" and prefers JSON as
  source of truth ([README](https://github.com/lukasoppermann/design-tokens#readme)).

### Tokens Studio for Figma

- **Model inversion**: tokens live in the plugin (or synced git), then get
  _pushed to_ Figma variables/styles — not "export what the designer built in
  Figma". Wrong direction for our ADR workflow.
- **Free tier**: export to Figma per token set; **cannot create modes** in a
  collection ([token sets](https://docs.tokens.studio/figma/export/token-sets)).
  Themes with mode switching are Pro (paid)
  ([themes](https://docs.tokens.studio/figma/export/themes)).
- **DTCG**: opt-in `$value`/`$type` since release 2.0; names may not contain
  `{ }` or `$` ([changelog](https://feedback.tokens.studio/changelog/release-20)).
- **Pipeline**: its output needs
  [`@tokens-studio/sd-transforms`](https://github.com/tokens-studio/sd-transforms)
  (v2.0.3 peer-depends on `style-dictionary ^5.0.0`) for math expressions, px
  units, fontWeight names, color modifiers, `innerShadow → inset`.

### Figma first-party sample ("Variables Import/Export")

- Lives in [figma/plugin-samples](https://github.com/figma/plugin-samples);
  install requires importing it as a development plugin.
- Emits `$type`/`$value`, one `collection.mode.tokens.json` per mode, aliases as
  `{path.to.var}` ([code.js](https://github.com/figma/plugin-samples/blob/master/variables-import-export/code.js)).
- Skips every type except `COLOR` and `FLOAT` — no strings, booleans, or styles.

## Style Dictionary v5 implications

- **DTCG is first-class since v4**; v5 continues it
  ([styledictionary.com/info/dtcg](https://styledictionary.com/info/dtcg/)).
  `usesDtcg` is **auto-detected**
  ([config reference](https://styledictionary.com/reference/config/)).
  TokensBrücke output therefore parses with **zero custom parsers**.
- **DTCG 2025.10 is only partially supported**; the dtcg page calls full support
  "a work in progress in v5". Dimension **object values** `{value, unit}` landed
  in **v5.4.0** ([releases](https://github.com/style-dictionary/style-dictionary/releases)).
  Our installed 5.1.0 predates that — update within `^5.1.0`, or disable the
  plugin's 2025.10 toggle.
- **Composite → CSS** is covered by predefined transforms
  ([reference](https://styledictionary.com/reference/hooks/transforms/predefined/)):
  - `shadow/css/shorthand` — `2px 4px 8px #000, …` (handles arrays and inset)
  - `typography/css/shorthand` — `italic 400 1.2rem/1.5 'Fira Sans'`
  - `transition/css/shorthand`, `cubicBezier/css`, `time/seconds`
  - `fontFamily/css`
- **Per-plugin needs**:
  - TokensBrücke → nothing extra; optionally a preprocessor to strip
    `$extensions.mode` if modes ever appear.
  - variables2json → full custom
    [parser](https://styledictionary.com/reference/config/) to reshape
    collections/modes into a token tree; references are already lost.
  - Design Tokens plugin → works as "legacy" `value`/`type` input, but do not
    mix with our `$`-prefixed files in one build.
  - Tokens Studio → `@tokens-studio/sd-transforms` preprocessor + transform group.

## The non-variable categories

Figma variables hold only **color, number, string, boolean** (plus new
**timing** and **easing** for Figma Motion). Color variables can feed gradient
_stops_ and shadow _colors_, and numbers can feed blur/spread — but a **shadow,
text style, or gradient as a whole cannot be a variable**; those remain styles
([Figma variables overview](https://help.figma.com/hc/en-us/articles/14506821864087-Overview-of-variables-collections-and-modes)).
The DTCG spec models them as composites:
[shadow](https://tr.designtokens.org/format/#shadow),
[typography](https://tr.designtokens.org/format/#typography),
[transition](https://tr.designtokens.org/format/#transition),
[gradient](https://tr.designtokens.org/format/#gradient), plus
[aliases](https://tr.designtokens.org/format/#aliases-references).

How the recommended path (TokensBrücke) covers each category:

- **Base + semantic colors** — Figma color variables in two collections;
  aliases exported intact as `{references}`.
- **Spacing, radii, text sizes, font weights** — number variables → `dimension`
  / `fontWeight` tokens.
- **Elevation / shadows** — Figma **effect styles** → DTCG `shadow` composites
  (arrays, inset) → `shadow/css/shorthand`.
- **Typography composites** — Figma **text styles** → DTCG `typography`
  composites → `typography/css/shorthand`.
- **Materials: gradients** — Figma **paint styles** → DTCG `gradient`
  composites. Note: Style Dictionary ships no gradient-to-CSS shorthand
  transform ([predefined list](https://styledictionary.com/reference/hooks/transforms/predefined/));
  add one small custom transform.
- **Materials: image fills** — no surveyed plugin exports them. Keep as
  hand-maintained tokens or static assets.
- **Motion durations** — model as number variables (ms) → `duration` tokens →
  `time/seconds`. Figma's `timing` variable type exists, but plugin support for
  exporting it is **unverified**.
- **Motion easings** — cannot round-trip as classic variables; either keep them
  hand-maintained in `tokens/`, or store the four bezier numbers as number
  variables and compose `cubicBezier` in a transform. Figma's `easing` variable
  type is Motion-focused; export support **unverified**.

## Figma plan limits (modes)

Per [Figma's plans article](https://help.figma.com/hc/en-us/articles/360040328273):
**Starter** — no extra variable modes; **Professional** — up to 10 modes per
collection; **Organization** — up to 20; **Enterprise** — unlimited with
extended collections. Up to 5,000 variables per collection on all plans
([overview](https://help.figma.com/hc/en-us/articles/14506821864087-Overview-of-variables-collections-and-modes)).
Single-theme today, so the Starter limit does not bite; a future dark mode
would require Professional or per-mode files.

## Sources

All claims cite the primary source inline above. Items marked **unverified**
could not be confirmed from a primary source (Figma community plugin pages
return HTTP 403 to non-browser fetchers; variables2json's plugin code is not
public; some GitHub release dates could not be independently confirmed).
