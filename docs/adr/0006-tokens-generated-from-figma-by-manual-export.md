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

## Consequences

- `tokens.css` is committed rather than gitignored, since nothing in CI can regenerate
  it. Token changes therefore appear as reviewable diffs.
- The file carries a generated-file header and sits in `.prettierignore`.
