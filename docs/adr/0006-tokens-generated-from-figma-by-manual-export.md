# Design tokens are generated from Figma, exported by hand

`src/styles/tokens.css` is built by Style Dictionary from token JSON exported out of
Figma. The file is generated and committed — never hand-edited — and the export step is a
plugin click, not an automated sync.

Recorded because the export being manual looks like an oversight. It isn't: Figma's
Variables REST API is restricted to Enterprise-plan organisations, so the
designer-commits-and-CI-rebuilds pipeline that the tooling otherwise supports is not
available on this account. A future reader proposing to automate it needs to know that
the blocker is licensing, not effort.

## Considered options

- **Hand-maintained `tokens.css`.** Rejected: the design system originates in Figma, and
  hand-copying values reintroduces the drift the token layer exists to prevent.
- **Figma REST API + CI rebuild.** Rejected on plan availability, not on merit. Revisit
  if the account ever changes.

## Provenance (amended after the design phase)

The token values were first authored in a Claude design system generated from the
written brief, then transferred to Figma and restructured into variable collections.
**Figma is canonical from that transfer on.** Claude design remains in use as a
prototyping surface; its changes sync into Figma before anything downstream consumes
them. See [the design milestone](../journey/02-design.md) for the full loop.

The repo's `tokens/*.json` still hold pre-design placeholder values. Do not hand-edit
them toward the design — the first Figma export replaces them wholesale.

**Amended (token architecture):** the export covers what Figma can express;
values it cannot hold (material gradients, easings, composed shorthands) live in
a hand-owned tier. "Replaces wholesale" now scopes to `tokens/figma/` only. The
plugin is TokensBrücke. See
[ADR-0010](./0010-two-tier-token-sources.md).

## Consequences

- `tokens.css` is committed rather than gitignored, since nothing in CI can regenerate
  it. Token changes therefore appear as reviewable diffs.
- The file carries a generated-file header and sits in `.prettierignore`.
